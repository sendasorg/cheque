// Strict YAML subset for Stroppers config files: block mappings, block
// sequences of scalars or mappings, plain/quoted scalars, comments. Anything
// else (anchors, tags, flow collections, multi-line scalars) is rejected so a
// config never parses into something different from what it looks like.

export class YamlError extends Error {
  constructor(line, message) {
    super(`line ${line}: ${message}`);
    this.line = line;
  }
}

function stripComment(text) {
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '#' && (i === 0 || /\s/.test(text[i - 1]))) return text.slice(0, i);
  }
  return text;
}

function scalar(raw, line) {
  const v = raw.trim();
  if (v === '' || v === '~' || v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === '[]') return [];
  if (v === '{}') return {};
  if (/^-?\d+$/.test(v)) return Number(v);
  if (/^-?\d+\.\d+$/.test(v)) return Number(v);
  if (v.startsWith('"')) {
    if (!v.endsWith('"') || v.length < 2) throw new YamlError(line, 'unterminated double-quoted string');
    return JSON.parse(v);
  }
  if (v.startsWith("'")) {
    if (!v.endsWith("'") || v.length < 2) throw new YamlError(line, 'unterminated single-quoted string');
    return v.slice(1, -1).replace(/''/g, "'");
  }
  if (/^[[{&*!|>%@`]/.test(v)) throw new YamlError(line, `unsupported YAML syntax: ${v}`);
  return v;
}

function tokenize(text) {
  const lines = [];
  text.split(/\r?\n/).forEach((rawLine, i) => {
    if (/\t/.test(rawLine.match(/^\s*/)[0])) throw new YamlError(i + 1, 'tabs are not allowed for indentation');
    const body = stripComment(rawLine).replace(/\s+$/, '');
    if (body.trim() === '' || body.trim() === '---') return;
    lines.push({ n: i + 1, indent: body.match(/^ */)[0].length, text: body.trim() });
  });
  return lines;
}

const KEY = /^([A-Za-z0-9_.-]+|"[^"]*"):(?:\s+(.*))?$/;

export function parseYaml(text) {
  const lines = tokenize(text);
  let pos = 0;

  function parseBlock(indent) {
    const first = lines[pos];
    if (!first || first.indent < indent) return null;
    return first.text.startsWith('- ') || first.text === '-' ? parseSeq(first.indent) : parseMap(first.indent);
  }

  function parseMap(indent) {
    const out = {};
    while (pos < lines.length && lines[pos].indent === indent) {
      const { n, text: t } = lines[pos];
      if (t.startsWith('- ')) throw new YamlError(n, 'sequence item where a key was expected');
      const m = t.match(KEY);
      if (!m) throw new YamlError(n, `expected "key: value", got: ${t}`);
      const key = m[1].startsWith('"') ? JSON.parse(m[1]) : m[1];
      if (Object.hasOwn(out, key)) throw new YamlError(n, `duplicate key ${key}`);
      pos++;
      if (m[2] !== undefined && m[2] !== '') out[key] = scalar(m[2], n);
      else {
        const next = lines[pos];
        out[key] = next && next.indent > indent ? parseBlock(next.indent) : null;
      }
    }
    if (pos < lines.length && lines[pos].indent > indent) throw new YamlError(lines[pos].n, 'unexpected indentation');
    return out;
  }

  function parseSeq(indent) {
    const out = [];
    while (pos < lines.length && lines[pos].indent === indent && lines[pos].text.startsWith('-')) {
      const { n, text: t } = lines[pos];
      const rest = t === '-' ? '' : t.slice(2).trim();
      if (rest === '') {
        pos++;
        out.push(parseBlock(indent + 1));
      } else if (KEY.test(rest)) {
        // "- key: value" starts a mapping whose keys align two columns in.
        lines[pos] = { n, indent: indent + 2, text: rest };
        out.push(parseMap(indent + 2));
      } else {
        out.push(scalar(rest, n));
        pos++;
      }
    }
    return out;
  }

  const result = parseBlock(0) ?? {};
  if (pos < lines.length) throw new YamlError(lines[pos].n, 'unexpected content');
  return result;
}

function emitScalar(v) {
  if (v === null) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (/^[A-Za-z0-9_./@:+-][A-Za-z0-9_./@:+ -]*$/.test(v) && !/^(true|false|null|~|-?\d+(\.\d+)?)$/.test(v) && !v.includes(': ') && !v.endsWith(':'))
    return v;
  return JSON.stringify(v);
}

export function stringifyYaml(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          const inner = stringifyYaml(item, indent + 2).replace(/^ +/, '');
          return `${pad}- ${inner}`;
        }
        return `${pad}- ${emitScalar(item)}\n`;
      })
      .join('');
  }
  return Object.entries(value)
    .map(([k, v]) => {
      if (v && typeof v === 'object') {
        if (Array.isArray(v) && v.length === 0) return `${pad}${k}: []\n`;
        return `${pad}${k}:\n${stringifyYaml(v, indent + 2)}`;
      }
      return `${pad}${k}: ${emitScalar(v)}\n`;
    })
    .join('');
}
