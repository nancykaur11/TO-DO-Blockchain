import { useState, useEffect } from "react";
import { ethers } from "ethers";
import TodoContract from "./TodoContractABI.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    async function setup() {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const abi = TodoContract.abi || TodoContract;

      const c = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      setAccount(await signer.getAddress());
      setContract(c);
    }
    setup();
  }, []);

  useEffect(() => {
    if (contract) loadFromChain();
  }, [contract]);

  async function loadFromChain() {
    try {
      const data = await contract.getAllTasks();
      const list = data
        .filter((t) => !t.deleted)
        .map((t) => ({
          id: Number(t.id),
          content: t.content,
          completed: t.completed,
        }));
      setTasks(list);
    } catch {}
  }

  function addLocal() {
    if (!input.trim()) return;

    const task = {
      id: "temp-" + Date.now(),
      content: input,
      completed: false,
    };

    setTasks([...tasks, task]);
    setPending([...pending, { type: "add", task }]);
    setInput("");
  }

  function toggleLocal(id) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    setPending([...pending, { type: "toggle", id }]);
  }

  function deleteLocal(id) {
    setTasks(tasks.filter((t) => t.id !== id));
    setPending([...pending, { type: "delete", id }]);
  }

  // async function sync() {
  //   if (!contract) return;
  //   if (pending.length === 0) return;

  //   const idMap = {};

  //   for (const change of pending) {
  //     if (change.type === "add") {
  //       const tx = await contract.createTask(change.task.content);
  //       const receipt = await tx.wait();

  //       const log = receipt.logs.find((l) => l.fragment?.name === "TaskCreated");
  //       const realId = Number(log.args.id);

  //       idMap[change.task.id] = realId;
  //     }
  //   }

  //   const updatedPending = pending
  //     .filter((p) => p.type !== "add")
  //     .map((p) => {
  //       let newId = p.id;
  //       if (typeof newId === "string" && newId.startsWith("temp-")) {
  //         newId = idMap[newId];
  //       }
  //       return { ...p, id: newId };
  //     });

  //   for (const item of updatedPending) {
  //     if (item.type === "toggle") {
  //       const tx = await contract.toggleComplete(item.id);
  //       await tx.wait();
  //     }
  //     if (item.type === "delete") {
  //       const tx = await contract.deleteTask(item.id);
  //       await tx.wait();
  //     }
  //   }

  //   setPending([]);
  //   await loadFromChain();
  //   alert("Synced");
  // }

async function sync() {
  if (!contract) return;
  if (pending.length === 0) return;

  const actions = [];
  const ids = [];
  const contents = [];

  // 1) Handle ADD actions first → create real IDs
  for (const p of pending) {
    if (p.type === "add") {
      actions.push(1);            // create
      ids.push(0);                // unused
      contents.push(p.task.content);
    }
  }

  // Send add actions first (batch 1)
  let addReceipt;
  if (actions.length > 0) {
    const tx = await contract.batchActions(actions, ids, contents);
    addReceipt = await tx.wait();
  }

  // Map events → real on-chain IDs
  let createdIds = [];
  if (addReceipt) {
    createdIds = addReceipt.logs
      .filter((l) => l.fragment?.name === "TaskCreated")
      .map((l) => Number(l.args.id));
  }

  // Build mapping temp → real
  const tempToReal = {};
  let idx = 0;
  for (const p of pending) {
    if (p.type === "add") {
      tempToReal[p.task.id] = createdIds[idx++];
    }
  }

  // 2) Build batch for toggle + delete, but skip temporary IDs
  const actions2 = [];
  const ids2 = [];
  const contents2 = [];

  for (const p of pending) {

    let realId = p.id;

    // convert temp-xx → real on-chain id
    if (String(realId).startsWith("temp-")) {
      if (!tempToReal[realId]) continue; // skip
      realId = tempToReal[realId];
    }

    if (p.type === "toggle") {
      actions2.push(2);
      ids2.push(realId);
      contents2.push("");
    }

    if (p.type === "delete") {
      actions2.push(3);
      ids2.push(realId);
      contents2.push("");
    }
  }

  // Send batch 2
  if (actions2.length > 0) {
    const tx2 = await contract.batchActions(actions2, ids2, contents2);
    await tx2.wait();
  }

  setPending([]);
  await loadFromChain();
  alert("Synced!");
}



  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Todo </h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Local task"
          style={{
            padding: "0.5rem",
            marginRight: "0.5rem",
            width: "250px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={addLocal}
          style={{
            padding: "0.5rem 1rem",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Add Local
        </button>
      </div>

      <h3>Pending: {pending.length}</h3>

      <button
        onClick={sync}
        disabled={pending.length === 0}
        style={{
          padding: "0.6rem 1rem",
          background: pending.length ? "purple" : "gray",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: pending.length ? "pointer" : "not-allowed",
          marginBottom: "1.5rem",
        }}
      >
        Sync to Blockchain
      </button>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((t) => (
          <li
            key={t.id}
            style={{
              marginBottom: "0.5rem",
              background: "#f0f0f0",
              color: "black",
              padding: "0.5rem",
              borderRadius: "8px",
              width: "320px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ textDecoration: t.completed ? "line-through" : "none" }}>
              {t.content}
            </span>

            <div>
              <button
                onClick={() => toggleLocal(t.id)}
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
                onClick={() => deleteLocal(t.id)}
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
