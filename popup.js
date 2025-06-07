document.getElementById('escapeBtn').addEventListener('click', () => {
  const input = document.getElementById('inputBox').value;
  const compact = document.getElementById('compactCheckbox').checked;


  try {
    let minified = input;
    if (compact) {
      // Try to parse and re-stringify to remove whitespace
      minified = JSON.stringify(JSON.parse(input));
    }
    // Now escape the (possibly minified) string
    const escaped = JSON.stringify(minified);
    document.getElementById('outputBox').value = escaped;
  } catch (e) {
    document.getElementById('outputBox').value = 'Invalid input. Cannot escape.';
  }
});

document.getElementById('unescapeBtn').addEventListener('click', () => {
  let input = document.getElementById('inputBox').value;
  try {
    const unescaped = JSON.parse(input);
    document.getElementById('outputBox').value = unescaped;
  } catch (e) {
    document.getElementById('outputBox').value = 'Invalid input. Cannot unescape.';
  }
});

document.getElementById('copyBtn').addEventListener('click', () => {
  const output = document.getElementById('outputBox').value;
  navigator.clipboard.writeText(output)
    .then(() => showToast('Copied to clipboard!'))
    .catch(() => showToast('Failed to copy.'));
});

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'toast';
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }, 10);
}

document.getElementById('protoToJsonBtn').addEventListener('click', () => {
  const input = document.getElementById('inputBox').value;
  try {
    const jsonObj = protoToJson(input);
    document.getElementById('outputBox').value = JSON.stringify(jsonObj, null, 2);
  } catch (e) {
    document.getElementById('outputBox').value = 'Invalid proto format. Cannot convert.';
  }
});

function protoToJson(protoText) {
  protoText = protoText.replace(/^\s*\/\/.*$/gm, '').trim();

  // Helper function to parse blocks recursively
  function parseBlock(lines) {
    const obj = {};
    let i = 0;
    while (i < lines.length) {
      let line = lines[i].trim();
      if (!line) { i++; continue; }

      // Match: key: value
      let match = line.match(/^(\w+):\s*(.+)$/);
      // Match: key { (start of nested object)
      let nestedMatch = line.match(/^(\w+)\s*\{$/);

      if (match) {
        let [, key, value] = match;
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value)) value = Number(value);
        else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);

        // Handle repeated fields
        if (obj[key]) {
          if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
          obj[key].push(value);
        } else {
          obj[key] = value;
        }
        i++;
      } else if (nestedMatch) {
        let key = nestedMatch[1];
        let blockLines = [];
        let depth = 1;
        i++;
        while (i < lines.length && depth > 0) {
          if (lines[i].includes('{')) depth++;
          if (lines[i].includes('}')) depth--;
          if (depth > 0) blockLines.push(lines[i]);
          i++;
        }
        let value = parseBlock(blockLines);

  
        if (obj[key]) {
          if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
          obj[key].push(value);
        } else {
          obj[key] = value;
        }
      } else {
        i++;
      }
    }
    return obj;
  }

  // Split lines and parse
  const lines = protoText.split('\n');
  return parseBlock(lines);
}

