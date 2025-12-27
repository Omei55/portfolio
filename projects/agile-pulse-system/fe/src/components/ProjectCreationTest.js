import React, { useState } from "react";
import ProjectCreationModal from "./ProjectCreationModal";
import "./Dashboard.css";

const ProjectCreationTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [projects, setProjects] = useState([]);

  const handleSaveProject = (newProject) => {
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    console.log("Project created:", newProject);
    console.log("All projects:", updatedProjects);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: "40px", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "20px" }}>Project Creation Modal Test</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#9333ea",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          Open Project Creation Modal
        </button>

        <ProjectCreationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProject}
        />

        {projects.length > 0 && (
          <div style={{ marginTop: "40px" }}>
            <h2>Created Projects:</h2>
            <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <h3 style={{ color: "#9333ea", margin: "0 0 8px 0" }}>
                    {project.title}
                  </h3>
                  <p style={{ color: "#666", margin: "0 0 8px 0" }}>
                    {project.subtitle}
                  </p>
                  <p style={{ margin: "0" }}>
                    {project.completed}/{project.total} stories completed
                  </p>
                  <p style={{ margin: "4px 0 0 0", color: "#666" }}>
                    Due: {project.dueDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCreationTest;
