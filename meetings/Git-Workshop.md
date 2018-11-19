# Git Workshop

## Terminology

HEAD

: the latest commit

master

: the "main" branch that is supposed to be kept clean

branch

: a history (sequence) of commits

Commit

:   -   a named and hashed bundle of changes to files

    -   a single commit is supposed to address some specific issues

    E.g.:

    Good commit message: "Fixed the database design" Bad commit message:
    "Updated docs, fixed UI, changed tests, refactored code"

Commit SHA (Secure Hashing Algorithm)

: git hashes commits, hashes allow you to reference commits

Origin

: the remote repository that you cloned from (set by git automatically)

## Basic Workflow

  #   Action                                   Cmd
  --- ---------------------------------------- ----------------------
  1   Pull                                     `$ git pull`{.sh}
  2   Make a new branch to solve the problem   `$ git branch <new_branch_name>`{.sh}
  3   Make changes to files                    --
  4   Add (approve for next commit) changes    `$ git add -- <file1> <files2> ...`{.sh}
  5   Commit the changes                       `$ git commit -m <message>`{.sh}
  6   if done then GOTO 3 else  push to origin `$ git push origin`{.sh}

![branch](/home/norbert/Pictures/branch.jpeg)

## Setting Up

- Before you can start working on the code you need to clone it with `$ git clone`{.sh}

## Staying Up-To-Date 

- You want the code on your machine to be in sync with the code in the remote
  repository.
- Before you create a new branch to start working on a new feature, make sure
  to run `$ git pull`{.sh} (this will try to integrate the changes from `origin/master` into your local branch)

## Checking the State of the Repository

  Problem                                   Solution
  ----------------------------------------- -------------------------------
  What branch am I on?                      `$ git branch`{.sh}
  What changes have I added / not added yet `$ git status`{.sh}
  See last 10 commits                       `$ git log -10`{.sh} 
  See last 5 commits with file changes      `$ git log --stat -5`{.sh} 
  See commit messages & hashes only         `$ git log --format=oneline`{.sh}

## When Things Go Wrong (reverting changes)

  Problem                                   Solution
  ----------------------------------------- -------------------------------
  Revert the changes in a file              `$ git checkout <commit> -- <file1> <file2> ...`{.sh}
  Revert all to commit                      `$ git checkout <commit>`{.sh}
  Typo in the commit message                `$ git commit --ammend -m "New message"`{.sh}
  Unstage files                             `$ git reset -- <file1> <file2> ...`{.sh}
  Unstage all                               `$ git reset`{.sh}

## Diffing (comparing)

### Summarising (What Has Changed?)

```sh
git diff --stat
```

### Compare added changes

```sh
git diff --cached
```

### Compare files between commits / branches

```sh
# for all files
$ git diff <commit|branch1>..<commit|branch2>

# for specific files
$ git diff <commit|branch1>:<file>..<commit|branch2>:<file>

# what the file was like 5 commits ago
$ git diff HEAD~5 -- <file>

# difference between what the file was like 5 commits ago and 3 commits ago
$ git diff HEAD~5:./app.js..HEAD~3:./app.js

# with remote 
$ git diff <remote>/<branch1>:<file>..<remote>/<branch2>:<file>
```

### Commit References

  What                                      Syntax         
  ----------------------------------------- -------------------------------
  N commits ago                             `<commit>~<n>` e.g.: `HEAD~3`
  The parent of the commit                  `<commit>^` e.g.: `HEAD^`
  Most recent commit                        `HEAD`
  State of the master branch yesterday      `master@{yesterday}`
  State of the master branch yesterday      `master@{yesterday}`

**NOTE** the default commit is typically `HEAD`. When you type `$ git diff` it
compares the current state of files to the `HEAD`.

See <https://git-scm.com/book/en/v2/Git-Tools-Revision-Selection>.

## References

- `$ man git commit`{.sh}
- `$ man git add`{.sh}
- `$ man git reset`{.sh}
- `$ man git checkout`{.sh}
- `$ man git pull`{.sh}
- <https://github.com/k88hudson/git-flight-rules>
