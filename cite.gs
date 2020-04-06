/**
 *@OnlyCurrentDoc
 */

function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('Cite');
  DocumentApp.getUi().showSidebar(ui);
}

function getSelectedText() {
  var selection = DocumentApp.getActiveDocument().getSelection();
  var text = [];
  if (selection) {
    var elements = selection.getSelectedElements();
    for (var i = 0; i < elements.length; ++i) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();

        text.push(element.getText().substring(startIndex, endIndex + 1));
      } else {
        var element = elements[i].getElement();
        if (element.editAsText) {
          var elementText = element.asText().getText();
          if (elementText) {
            text.push(elementText);
          }
        }
      }
    }
  }
  if (!text.length) throw new Error('Please select some text.');
  return text;
}

function getCitedTextAndText() {
  var text = getSelectedText().join('\n');
  return {
    text: text,
    citation: placeholderTesting(text)
  };
}

function insertText(newText) {
  var selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) {
    var replaced = false;
    var elements = selection.getSelectedElements();
    if (elements.length === 1 && elements[0].getElement().getType() ===
        DocumentApp.ElementType.INLINE_IMAGE) {
      throw new Error('Can\'t insert text into an image.');
    }
    for (var i = 0; i < elements.length; ++i) {
      if (elements[i].isPartial()) {
        var element = elements[i].getElement().asText();
        var startIndex = elements[i].getStartOffset();
        var endIndex = elements[i].getEndOffsetInclusive();
        element.deleteText(startIndex, endIndex);
        if (!replaced) {
          element.insertText(startIndex, newText);
          replaced = true;
        } else {
          var parent = element.getParent();
          var remainingText = element.getText().substring(endIndex + 1);
          parent.getPreviousSibling().asText().appendText(remainingText);
          if (parent.getNextSibling()) {
            parent.removeFromParent();
          } else {
            element.removeFromParent();
          }
        }
      } else {
        var element = elements[i].getElement();
        if (!replaced && element.editAsText) {
          element.clear();
          element.asText().setText(newText);
          replaced = true;
        } else {
          if (element.getNextSibling()) {
            element.removeFromParent();
          } else {
            element.clear();
          }
        }
      }
    }
  } else {
    var cursor = DocumentApp.getActiveDocument().getCursor();
    var surroundingText = cursor.getSurroundingText().getText();
    var surroundingTextOffset = cursor.getSurroundingTextOffset();
    if (surroundingTextOffset > 0) {
      if (surroundingText.charAt(surroundingTextOffset - 1) != ' ') {
        newText = ' ' + newText;
      }
    }
    if (surroundingTextOffset < surroundingText.length) {
      if (surroundingText.charAt(surroundingTextOffset) != ' ') {
        newText += ' ';
      }
    }
    cursor.insertText(newText);
  }
}
function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('bar')
      .setTitle('Cite');
  DocumentApp.getUi().showSidebar(ui);
}

function placeholderTesting(toBeCited){
  var apa = true; 
  var doi = toBeCited;
  var url = "https://tools.wmflabs.org/citer/citer.fcgi?json=true&input_type=url-doi-isbn&user_input=" + doi + "&dateformat=%25B+%25-d%2C+%25Y";
  var response = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
  var html = response.getContentText();
  html = html.substring((html.indexOf("}}<br><br>* {{") + 14), (html.indexOf("}}</div>")));
  Logger.log(html);
  var citation = "";
  if(apa == true){
    citation += (html.substring((html.indexOf("| last=") + 7), (html.indexOf(" | first="))) + ", " + html.substring((html.indexOf("| first=") + 8), (html.indexOf("| first=") + 9)));
    if(html.indexOf("| last3=") != -1){
     citation += " et. al. "; 
    }else if(html.indexOf("| last2=") != -1){
      citation += " & " + (html.substring((html.indexOf("| last2=") + 8), (html.indexOf(" | first2="))) + ", " + html.substring((html.indexOf("| first2=") + 9), (html.indexOf("| first2=") + 10))) + ". ";
    }else{
     citation += ". " 
    }
    if(html.indexOf("| date=") != -1){
      if (html.indexOf(" | issn") != -1){
        citation += "(" + html.substring((html.indexOf(" | issn") - 4),((html.indexOf(" | issn")))) + ", " + html.substring((html.indexOf("| date=") + 7),((html.indexOf(" | issn") - 6))) + "). ";
      }else{
        citation += "(" + html.substring((html.indexOf(" | isbn") - 4),((html.indexOf(" | isbn")))) + ", " + html.substring((html.indexOf("| date=") + 7),((html.indexOf(" | isbn") - 6))) + "). ";
      }
    }else{
      if (html.indexOf(" | issn") != -1){
        citation += "(" + html.substring((html.indexOf("| year=") + 7), ((html.indexOf(" | issn")))) + "). ";
      }else{
        citation += "(" + html.substring((html.indexOf("| year=") + 7), ((html.indexOf(" | isbn")))) + "). ";
      }
    }
    if(html.indexOf("cite book") != -1){
      citation += html.substring((html.indexOf("| title=") + 8),(html.indexOf(" | publisher="))) + ". <i>";
      //var start = citation.length;
      citation += html.substring((html.indexOf("| publisher=") + 12),(html.indexOf(" | publication-place=")));
      //var end = citation.length;
      citation += "<i>. " + doi;
    }else{
      citation += html.substring((html.indexOf("| title=") + 8),(html.indexOf(" | journal="))) + ". <i>";
      //var start = citation.length;
      citation += html.substring((html.indexOf("| journal=") + 10),(html.indexOf(" | publisher=")));
      //var end = citation.length;
      citation += "<i>. " + doi;
    }
  }
  Logger.log(citation);
  return citation;
}
