# CodeChat-TextEditor
Literate Programming is the mindset of a developer to write human-readable source code, not just for compilation by computer but also for the organization and flow of thought between self and others. There are only a few tools that extract documentation directly from source code and they each exhibit limitations. However, CodeChat, a ‘programmer’s word processor’, addresses these limitations by producing a document directly from the source code simply and instantly. Currently, CodeChat uses a unique and discontinued development environment to edit source code and preview documentation. This project separates CodeChat’s functionality from its outdated environment and creates portability through plugins for popular editors like Sublime and Atom. As a developer writes a program in Sublime or Atom, their actions are sent to a server via a TCP/IP connection. The server will then invoke CodeChat to transform the program into a web page, and produce a beautiful and descriptive HTML output. This client/server separation allows for cloud development, compartmentalized support, and versatile GUI output. Currently we have built a successful demo for Atom and started a package for Sublime Text.

## Installation Process
### Sublime
* Clone or Download zip of repository
* Find the simpleClient.py file in Sublime Folder
* Navigate to Sublime installation directory and copy and paste simpleClient.py into Sublime\Data\Packages\User
* Edit simpleClient.py to update your preferred IP
* Ctrl + S to reload plugins
* Open and run PyServerJson.py

### Atom
* Clone or Download zip of repository
* Navigate to Atom installation directory and copy and paste codechat-plugin folder into .atom\packages
* Reload Window with Ctrl + Shft + F5 (Windows) to update packages
* Edit codechat-plugin-view.js to update your preferred IP
* Open and run PyServerJson.py, choose Build on Save or Build on Modified option (only compatible on Atom)
