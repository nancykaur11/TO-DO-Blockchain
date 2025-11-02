// src/App.js
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import TodoContract from "./TodoContractABI.json"; // ✅ Make sure this file exists in src/

// ✅ Replace with your latest deployed address
const TODO_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [account, setAccount] = useState(null);

  // ✅ Connect wallet and load tasks
  useEffect(() => {
    async function init() {
      console.log("🔄 Initializing app...");
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("✅ Connected account:", accounts[0]);
        setAccount(accounts[0]);

        await loadTasks();
      } catch (err) {
        console.error("❌ Error connecting wallet:", err);
      }
    }

    init();
  }, []);

  // ✅ Load tasks from blockchain
  async function loadTasks() {
    try {
      console.log("🔍 Loading tasks...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log("✅ Provider created:", provider);

      console.log("Contract Address:", TODO_CONTRACT_ADDRESS);
      console.log("Raw ABI File Content:", TodoContract);

      const abiToUse = TodoContract.abi || TodoContract; // Handles both Hardhat & pure ABI JSONs
      console.log("✅ ABI to use:", abiToUse);

      const contract = new ethers.Contract(
        TODO_CONTRACT_ADDRESS,
        abiToUse,
        provider
      );

      console.log("✅ Contract instance created:", contract);

      const data = await contract.getAllTasks();
      console.log("📦 Raw data from contract:", data);

      const formatted = data
        .filter((t) => !t.deleted)
        .map((t) => ({
          id: Number(t.id),
          content: t.content,
          completed: t.completed,
        }));

      console.log("✅ Formatted tasks:", formatted);
      setTasks(formatted);
    } catch (err) {
      console.error("❌ Error loading tasks:", err);
    }
  }

  // ✅ Create a new task
  async function createTask() {
    if (!input.trim()) return;
    console.log("🆕 Creating task:", input);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("✅ Signer:", signer);

      const abiToUse = TodoContract.abi || TodoContract;
      const contract = new ethers.Contract(
        TODO_CONTRACT_ADDRESS,
        abiToUse,
        signer
      );
      console.log("✅ Contract (with signer):", contract);

      const tx = await contract.createTask(input);
      console.log("📤 Transaction sent:", tx);
      await tx.wait();
      console.log("✅ Task created successfully!");

      setInput("");
      await loadTasks();
    } catch (err) {
      console.error("❌ Error creating task:", err);
      alert(err.message);
    }
  }

  // ✅ Toggle task completion
  async function toggleTask(id) {
    console.log("🔁 Toggling task:", id);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const abiToUse = TodoContract.abi || TodoContract;
      const contract = new ethers.Contract(
        TODO_CONTRACT_ADDRESS,
        abiToUse,
        signer
      );

      const tx = await contract.toggleComplete(id);
      console.log("📤 Transaction sent:", tx);
      await tx.wait();
      console.log("✅ Task toggled!");
      await loadTasks();
    } catch (err) {
      console.error("❌ Error toggling task:", err);
    }
  }

  // ✅ Delete a task
  async function deleteTask(id) {
    console.log("🗑️ Deleting task:", id);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const abiToUse = TodoContract.abi || TodoContract;
      const contract = new ethers.Contract(
        TODO_CONTRACT_ADDRESS,
        abiToUse,
        signer
      );

      const tx = await contract.deleteTask(id);
      console.log("📤 Transaction sent:", tx);
      await tx.wait();
      console.log("✅ Task deleted!");
      await loadTasks();
    } catch (err) {
      console.error("❌ Error deleting task:", err);
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>📝 Blockchain Todo List</h1>
      <p>Connected Account: {account || "Not connected"}</p>

      <div style={{ marginBottom: "1rem" }}>
        <input
          style={{
            padding: "0.5rem",
            marginRight: "0.5rem",
            width: "250px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a new task"
        />
        <button
          onClick={createTask}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Add Task
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((t) => (
          <li
            key={t.id}
            style={{
              marginBottom: "0.5rem",
              background: "#f8f8f8",
              color:"black",
              padding: "0.5rem",
              borderRadius: "8px",
              width: "320px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                textDecoration: t.completed ? "line-through" : "none",
              }}
            >
              {t.content}
            </span>
            <div>
              <button
                onClick={() => toggleTask(t.id)}
                style={{
                  marginRight: "0.5rem",
                  background: "#007BFF",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.3rem 0.6rem",
                  cursor: "pointer",
                }}
              >
                Toggle
              </button>
              <button
                onClick={() => deleteTask(t.id)}
                style={{
                  background: "#E74C3C",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.3rem 0.6rem",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
