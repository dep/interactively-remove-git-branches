#!/usr/bin/env node

var inquirer = require("inquirer");
var fuzzy = require("fuzzy");
var spawn = require("child_process").spawn;
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)

inquirer.registerPrompt(
  "checkbox-plus",
  require("inquirer-checkbox-plus-prompt")
);

async function getGitBranches () {
  // Exec output contains both stderr and stdout outputs
  const output = await exec('git branch --no-color')

  return {
    output: output.stdout.replace(new RegExp("\n","g"), ',').replace(new RegExp(" ","g"), "").trim()
  }
};

const getBranchList = async () => {
  await getGitBranches().then((branchList) => {
    const branchArray = branchList.output.split(',').filter(n => n);

    function searchTheThings(answersSoFar, input) {
      input = input || "";

      return new Promise(function (resolve) {
        var fuzzyResult = fuzzy.filter(input, branchArray);

        var data = fuzzyResult.map(function (element) {
          return element.original;
        });

        resolve(data);
      });
    }

    if (branchArray.length) {
      inquirer
        .prompt([
          {
            type: "checkbox-plus",
            name: "removeBranches",
            message:
              "Choose branches to remove",
            pageSize: 20,
            source: searchTheThings,
          },
        ])
        .then((answers) => {
          answers.removeBranches.forEach((branch) => {
            console.log(`Removing branch ${branch}`);
            spawn("git", ["branch", "-D", branch]);
          });
          console.log("Done!");
        });
      } else {
        console.log("No branches found :(");
      }
  });
};

getBranchList();
