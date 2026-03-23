import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

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
  
  const [newTaskContent, setNewTaskContent] = useState("");

  useEffect(() => {
    localStorage.setItem("kanban-data", JSON.stringify(columns));
  }, [columns]);

  // Logic to make tasks in "Done" disappear after 7 seconds
  useEffect(() => {
    const doneColumnEntry = Object.entries(columns).find(([_, col]) => col.name === "Done");
    if (!doneColumnEntry) return;

    const [doneColumnId, doneColumn] = doneColumnEntry;

    if (doneColumn.items.length > 0) {
      const timer = setTimeout(() => {
        setColumns(prev => ({
          ...prev,
          [doneColumnId]: {
            ...prev[doneColumnId],
            items: [] 
          }
        }));
      }, 7000);

      return () => clearTimeout(timer);
    }
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

  const addTask = () => {
    if (!newTaskContent) return;
    const firstColumnId = Object.keys(columns)[0];
    const column = columns[firstColumnId];
    const newTask: Task = { id: uuidv4(), content: newTaskContent };
    
    setColumns({
      ...columns,
      [firstColumnId]: { ...column, items: [...column.items, newTask] }
    });
    setNewTaskContent("");
  };

  return (
    <div className="App">
      {/* Background Layer Removed */}

      <div className="add-task-container">
        <input
          type="text"
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          placeholder="Type new task..."
        />
        <button onClick={addTask}>Add Task</button>
      </div>

      <div className="board-container">
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="column">
              <h2>{column.name}</h2>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="droppable-area"
                    style={{
                      background: snapshot.isDraggingOver
                        ? "rgba(100, 108, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    {column.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="task-card"
                            style={{
                              backgroundColor: snapshot.isDragging ? "#646cff" : "#ffffff",
                              color: snapshot.isDragging ? "#ffffff" : "#333333",
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
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}
export default App;