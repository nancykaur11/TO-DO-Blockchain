const { expect } = require("chai");

describe("TodoList", function () {
  let Todo, todo, owner;

 beforeEach(async function () {
  const Todo = await ethers.getContractFactory("TodoList");
  todo = await Todo.deploy(); // ✅ deploy automatically waits
  console.log("Deployed at:", await todo.getAddress());
});

  it("creates a task", async () => {
    await todo.createTask("Buy milk");
    const t = await todo.tasks(1);
    expect(t.content).to.equal("Buy milk");
    expect(t.completed).to.equal(false);
  });

  it("toggles a task", async () => {
    await todo.createTask("Task 1");
    await todo.toggleComplete(1);
    const t = await todo.tasks(1);
    expect(t.completed).to.equal(true);
  });

  it("deletes a task (soft)", async () => {
    await todo.createTask("Task to delete");
    await todo.deleteTask(1);
    const t = await todo.tasks(1);
    expect(t.deleted).to.equal(true);
  });
});
