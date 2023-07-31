//Created by Davide Lenzi

function insertBold(editor) {    
  const selection = editor.getSelection();
  const range = selection.getRange();
  const selectedText = editor.session.getTextRange(range);
  
  if (selectedText.length > 0) {
      const newText = `**${selectedText}**`;
      editor.session.replace(range, newText);
      range.setStart(range.start.row, range.start.column + 2);
      range.setEnd(range.start.row, range.start.column + newText.length - 4);
  } else {
      const cursorText = "**BOLD**";
      editor.session.insert(range.start, cursorText);
      range.setStart(range.start.row, range.start.column + 2);
      range.setEnd(range.start.row, range.start.column + cursorText.length - 4);
  }
  
  selection.setSelectionRange(range);
  editor.focus();
}
function insertItalic(editor) {
  const selection = editor.getSelection();
  const range = selection.getRange();
  const selectedText = editor.session.getTextRange(range);
  
  if (selectedText.length > 0) {
      const newText = `*${selectedText}*`;
      editor.session.replace(range, newText);
      range.setStart(range.start.row, range.start.column + 1);
      range.setEnd(range.start.row, range.start.column + newText.length - 2);
  } else {
      const cursorText = "*ITALIC*";
      editor.session.insert(range.start, cursorText);
      range.setStart(range.start.row, range.start.column + 1);
      range.setEnd(range.start.row, range.start.column + cursorText.length - 2);
  }
  
  selection.setSelectionRange(range);
  editor.focus();
}
function insertStriked(editor) {
  const selection = editor.getSelection();
  const range = selection.getRange();
  const selectedText = editor.session.getTextRange(range);
  
  if (selectedText.length > 0) {
      const newText = `~~${selectedText}~~`;
      editor.session.replace(range, newText);
      range.setStart(range.start.row, range.start.column + 2);
      range.setEnd(range.start.row, range.start.column + newText.length - 4);
  } else {
      const cursorText = "~~STRIKETHROUGH~~";
      editor.session.insert(range.start, cursorText);
      range.setStart(range.start.row, range.start.column + 2);
      range.setEnd(range.start.row, range.start.column + cursorText.length - 4);
  }
  
  selection.setSelectionRange(range);
  editor.focus();
}
function insertBlockQuote(editor) {
  const selection = editor.getSelection();
  const range = selection.getRange();
  const selectedText = editor.session.getTextRange(range);
  
  if (selectedText.length > 0) {
      const newText = `> ${selectedText}`;
      editor.session.replace(range, newText);
      range.setStart(range.start.row, range.start.column + 2);
      range.setEnd(range.start.row, range.start.column + newText.length);
  } else {
      const cursorText = "> BLOCKQUOTE";
      editor.session.insert(range.start, cursorText);
      range.setStart(range.start.row, range.start.column + 2);
      range.setEnd(range.start.row, range.start.column + cursorText.length);
  }
  
  selection.setSelectionRange(range);
  editor.focus();
}
function insertTable(editor) {
  const selection = editor.getSelection();
  const range = selection.getRange();
  
  const cursorText = `|  |  |\n|--|--|\n|  |  |`;
  editor.session.insert(range.start, cursorText);
  range.setStart(range.start.row, range.start.column + 2);
  range.setEnd(range.start.row, range.start.column);
  
  selection.setSelectionRange(range);
  editor.focus();
}
function insertCode(editor) {
  const selection = editor.getSelection();
  const range = selection.getRange();
  const selectedText = editor.session.getTextRange(range);
  
  if (selectedText.length > 0) {
      const newText = `\`${selectedText}\``;
      editor.session.replace(range, newText);
      range.setStart(range.start.row, range.start.column + 1);
      range.setEnd(range.start.row, range.start.column + newText.length - 2);
  } else {
      const cursorText = "\`CODE\`";
      editor.session.insert(range.start, cursorText);
      range.setStart(range.start.row, range.start.column + 1);
      range.setEnd(range.start.row, range.start.column + cursorText.length - 2);
  }
  
  selection.setSelectionRange(range);
  editor.focus();
}