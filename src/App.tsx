import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable} from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import LiquidEther from "./LiquidEther";

// --- Types ---
interface Task {
  id: string;
  content: string;
}
interface Column {
  name: string;
  items: Task[];
}
interface Columns {
  [key: string]: Column;
}

// --- Initial Data ---
const columnsFromBackend: Columns = {
  [uuidv4()]: { name: "To Do", items: [] },
  [uuidv4()]: { name: "In Progress", items: [] },
  [uuidv4()]: { name: "Done", items: [] },
};

const App: React.FC = () => {
  const [columns, setColumns] = useState<Columns>(() => {
    const savedData = localStorage.getItem("kanban-data");
    return savedData ? JSON.parse(savedData) : columnsFromBackend;
  });
  
  // NEW: State for the "Add Task" input
  const [newTaskContent, setNewTaskContent] = useState("");

  useEffect(() => {
    localStorage.setItem("kanban-data", JSON.stringify(columns));
  }, [columns]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({ ...columns, [source.droppableId]: { ...column, items: copiedItems } });
    } else {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems },
      });
    }
  };

  // NEW: Function to add a task to the first column found
  const addTask = () => {
    if (!newTaskContent) return;
    
    // Find the first column key (usually "To Do")
    const firstColumnId = Object.keys(columns)[0];
    const column = columns[firstColumnId];
    
    const newTask: Task = { id: uuidv4(), content: newTaskContent };
    
    setColumns({
      ...columns,
      [firstColumnId]: { ...column, items: [...column.items, newTask] }
    });
    
    setNewTaskContent(""); // Clear input
  };

  return (
    <div className="App">
      {/* 2. Add the Background Layer */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
         <LiquidEther 
            mouseForce={25}
            isViscous={false}
            viscous={10}
            // You can tune these colors to match your dark theme
            colors={["#1e1e2e", "#535bf2", "#2d2d44", "#000000"]} 
         />
      </div>
      {/* Input Area */}
      <div className="add-task-container">
        <input
          type="text"
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          placeholder="Type new task..."
        />
        <button onClick={addTask}>Add Task</button>
      </div>

      {/* Board Area */}
      <div className="board-container">
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(columns).map(([columnId, column]) => {
            return (
              <div key={columnId} className="column">
                <h2>{column.name}</h2>
                <div style={{ margin: 8 }}>
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="droppable-area"
                        style={{
                          // Keep dynamic style for dragging visualization
                          background: snapshot.isDraggingOver
                            ? "rgba(100, 108, 255, 0.1)"
                            : "rgba(0,0,0,0.2)",
                        }}
                      >
                        {column.items.map((item, index) => (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="task-card"
                                style={{
                                  // Maintain inline style for drag physics
                                  backgroundColor: snapshot.isDragging
                                    ? "#535bf2"
                                    : "#2d2d44",
                                  ...provided.draggableProps.style,
                                }}
                              >
                                {item.content}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </DragDropContext>
      </div>
    </div>
  );
}
export default App;