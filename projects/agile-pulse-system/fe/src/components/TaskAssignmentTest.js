import React, { useState } from "react";
import TaskAssignmentModal from "./TaskAssignmentModal";
import "./TaskAssignmentModal.css";

const TaskAssignmentTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleOpen = () => {
    setIsModalOpen(true);
  };

  const handleAssignmentSuccess = (assignedStories) => {
    console.log("Tasks assigned successfully:", assignedStories);
    alert(`Successfully assigned ${assignedStories.length} task(s) to sprint!`);
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Task Assignment Modal Test</h1>
      <p>This is a test page to view the Task Assignment UI</p>
      <button
        onClick={handleOpen}
        style={{
          padding: "12px 24px",
          backgroundColor: "#9333ea",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Open Task Assignment Modal
      </button>

      <TaskAssignmentModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onAssignmentSuccess={handleAssignmentSuccess}
      />
    </div>
  );
};

export default TaskAssignmentTest;

