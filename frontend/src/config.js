export const TODO_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
export const TODO_ABI = [
  {
    "inputs": [{"internalType": "string","name": "_task","type": "string"}],
    "name": "createTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_index","type": "uint256"}],
    "name": "deleteTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_index","type": "uint256"}],
    "name": "toggleComplete",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTasks",
    "outputs": [
      {
        "components": [
          {"internalType": "string","name": "task","type": "string"},
          {"internalType": "bool","name": "completed","type": "bool"}
        ],
        "internalType": "struct TodoList.Task[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
