// Reads a text/event-stream response body and calls onEvent(name, data) for
// each event as it arrives. Only the "event:" and "data:" fields are used;
// data is parsed as JSON.
export async function readEventStream(body, onEvent) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;

    // Events are separated by a blank line; the last piece may be partial.
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop();

    for (const block of blocks) {
      let name = "message";
      const data = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) name = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trim());
      }
      if (data.length > 0) onEvent(name, JSON.parse(data.join("\n")));
    }
  }
}
