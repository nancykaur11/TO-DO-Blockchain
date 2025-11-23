// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TodoList {
    uint256 public taskCount = 0;

    struct Task {
        uint256 id;
        string content;
        bool completed;
        bool deleted;
    }

    mapping(uint256 => Task) public tasks;
    uint256[] public taskIds;

    event TaskCreated(uint256 id, string content);
    event TaskToggled(uint256 id, bool completed);
    event TaskDeleted(uint256 id);

    function createTask(string calldata _content) public {
        require(bytes(_content).length > 0, "Empty content");
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false, false);
        taskIds.push(taskCount);
        emit TaskCreated(taskCount, _content);
    }

  function toggleComplete(uint256 _id) public {
        Task storage t = tasks[_id];
        require(t.id != 0, "Task not found");
        require(!t.deleted, "Task deleted");
        t.completed = !t.completed;
        emit TaskToggled(_id, t.completed);
    }

   function deleteTask(uint256 _id) public {
        Task storage t = tasks[_id];
        require(t.id != 0, "Task not found");
        require(!t.deleted, "Already deleted");
        t.deleted = true;
        emit TaskDeleted(_id);
    }

    function getAllTasks() external view returns (Task[] memory) {
        uint256 len = taskIds.length;
        Task[] memory out = new Task[](len);
        for (uint256 i = 0; i < len; i++) {
            out[i] = tasks[taskIds[i]];
        }
        return out;
    }

  function batchActions(
        uint8[] calldata actionTypes,
        uint256[] calldata ids,
        string[] calldata contents
    ) external {
        require(
            actionTypes.length == ids.length &&
            actionTypes.length == contents.length,
            "Length mismatch"
        );

        for (uint256 i = 0; i < actionTypes.length; i++) {
            if (actionTypes[i] == 1) {
                createTask(contents[i]);
            } else if (actionTypes[i] == 2) {
                toggleComplete(ids[i]);
            } else if (actionTypes[i] == 3) {
                deleteTask(ids[i]);
            }
        }
    }
}
