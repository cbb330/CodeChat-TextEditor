# CodeChat-TextEditor
Literate Programming is the mindset of a developer to write human-readable source code, not just for compilation by computer but also for the organization and flow of thought between self and others. There are only a few tools that extract documentation directly from source code and they each exhibit limitations. However, CodeChat, a ‘programmer’s word processor’, addresses these limitations by producing a document directly from the source code simply and instantly. Currently, CodeChat uses a unique and discontinued development environment to edit source code and preview documentation. This project separates CodeChat’s functionality from its outdated environment and creates portability through plugins for popular editors like Sublime and Atom. As a developer writes a program in Sublime or Atom, their actions are sent to a server via a TCP/IP connection. The server will then invoke CodeChat to transform the program into a web page, and produce a beautiful and descriptive HTML output. This client/server separation allows for cloud development, compartmentalized support, and versatile GUI output.
