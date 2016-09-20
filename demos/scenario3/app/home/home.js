////////////////////////////////////////////////// populateHomeworkList
// Expects an array of objects to add to the given UL element
function populateEntitiesList(unorderedList, entities) {
  $.each(entities, function(){
    kn.renderEntityInList(unorderedList, this);
  });
}

///////////////////////////////////////////// onSearchChanged
function onSearchChanged(eventArgs) {  

  var searchValue = $(document).find("#mainSearchBox").val().toLowerCase();
  var matchingEntities = kn.searchForEntities(searchValue);

  var $resultsDiv = $(document).find("#results-div"); 
  var $ul = $(document).find("#results-ul");
  $ul.empty();

  if (matchingEntities.length > 0) {
    populateEntitiesList($ul, matchingEntities);
    $resultsDiv.slideDown();  
  }
  else {
    $resultsDiv.slideUP();    
  }
}

///////////////////////////////////////////// onDocumentReady
function onDocumentReady() {
    app.initialize();
    $(".ms-SearchBox").SearchBox();

    // Our search is being replaced by TellMe. Instead of searching, populate the list
    // immediately.
    // $("#mainSearchBox").change(onSearchChanged);

    var allEntities = kn.searchForEntities(null /*searchValue*/);
    var $resultsDiv = $(document).find("#results-div"); 
    var $ul = $(document).find("#results-ul");
    populateEntitiesList($ul, allEntities);
    $resultsDiv.slideDown();  
}

///////////////////////////////////////////// main
(function(){
  'use strict';

  Office.initialize = function(reason){
    jQuery(document).ready(onDocumentReady);
  };

})();