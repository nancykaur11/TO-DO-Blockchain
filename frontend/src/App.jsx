import { useState, useEffect } from "react";
import { ethers } from "ethers";
import TodoContract from "./TodoContractABI.json";

const TODO_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [pendingChanges, setPendingChanges] = useState([]);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    async function setup() {
      if (!window.ethereum) return alert("Install MetaMask");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const abi = TodoContract.abi;

      await provider.send("eth_requestAccounts", []);

      setAccount(await signer.getAddress());
      setContract(new ethers.Contract(TODO_CONTRACT_ADDRESS, abi, signer));
    }
    setup();
  }, []);

  const addLocalTask = () => {
    if (!input.trim()) return;
    const newTask = {
      id: Date.now(),
      content: input,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setPendingChanges([...pendingChanges, { type: "add", task: newTask }]);
    setInput("");
  };

  const toggleLocal = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    setPendingChanges([...pendingChanges, { type: "toggle", id }]);
  };

  const deleteLocal = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    setPendingChanges([...pendingChanges, { type: "delete", id }]);
  };

  const syncOnChain = async () => {
    for (const change of pendingChanges) {
      if (change.type === "add") {
        const tx = await contract.createTask(change.task.content);
        await tx.wait();
      }
      if (change.type === "toggle") {
        const tx = await contract.toggleComplete(change.id);
        await tx.wait();
      }
      if (change.type === "delete") {
        const tx = await contract.deleteTask(change.id);
        await tx.wait();
      }
    }
    alert("Synced with blockchain!");
    setPendingChanges([]);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Todo (Off-Chain First)</h2>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={addLocalTask}>Add</button>

      <ul>
        {tasks.map(t => (
          <li key={t.id}>
            <span style={{ textDecoration: t.completed ? "line-through" : "" }}>
              {t.content}
            </span>
            <button onClick={() => toggleLocal(t.id)}>Toggle</button>
            <button onClick={() => deleteLocal(t.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <button
        style={{ marginTop: 20, background: "green", color: "white" }}
        onClick={syncOnChain}
      >
        Sync to Blockchain (Only 1 popup)
      </button>
    </div>
  );
}

export default App;
