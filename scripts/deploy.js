async function main() {
  const Todo = await ethers.getContractFactory("TodoList");
  const todo = await Todo.deploy();

  // ethers v6: deployment is auto-waited, so no todo.deployed()
  console.log("TodoList deployed to:", await todo.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
