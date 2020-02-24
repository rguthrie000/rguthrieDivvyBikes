import React, { useState, useEffect } from "react";
import mapAPI from "./utils/googleAPI";
import tripsAPI from "./utils/tripsAPI"
import geoMath from "./utils.geoMath"
import SearchForm from "./components/SearchForm";
import {debug} from "../debug";
import "./App.css";

// On 'Demo Go!'
// 1. Randomized location over city area. Then pick closest station.
// 2. 2nd Randomized location over city area. Then pick closest station.
// 3. Time -- now, weekday morning, weekday afternoon, weekday evening, weekend/holiday day, weekend/holiday evening
// 4. fetch route for start/dest
// 5. fetch actuals from server - recent and near future days in category (weekday or weekend/holiday)
// 6. build and chart statistics - compare to Google's answer.


function App() {
  const haveStations = false;
  
  // Station list. A station:
  // {
  //   stationId   : < one of 611 numbers in 2..673 (not all values are used) >
  //   stationName : < string, descriptive of station location, e.g. an intersection or landmark>
  //   docks       : < bikes capacity >
  //   stationLat  : < latitude, a real number in 41.736646 - 42.064854, numbers are larger going North>
  //   stationLon  : < longitude, a real number in -87.774704 - -87.54938625, numbers are more negative going West>
 // }   
  const [stations,setStations] = useState({
    trigger : true,
    selectedStart :   2,
    selectedEnd   : 673,
    list : []
  });

  // When ready...
  useEffect( () => {
      if (!haveStations) {
        tripsAPI.getStations().then( (stationArr) => {
          setStations({trigger: stations.trigger + 1, stations: stationArr});
          haveStations = true;
        });
      }
    },
    // no monitoring  
    []
  );      

  return (
      <div className="container App">
        <div className="row App-header">
          <div id="nameBox">
              <h5>rguthrie's</h5>
              <h4>Divvy Bikes Planner</h4>
          </div>
          <div className="nav-button">
            <button className="page-choice" onClick={togglePage}>Go to {navIsSearch?"Saved":"Search"}</button>
          </div>
          <div>
            <SearchForm
              title={search.title}
              author={search.author}
              subject={search.subject}
              handleFormChange={handleFormChange}
              handleFormSubmit={handleFormSubmit}
            />
          </div>
          <h1 className="nav-title">{navIsSearch? "Search" : "Saved"}</h1>
        </div>
        <div>
          {generateCards(navIsSearch)}
        </div>
      </div>
  );
}

export default App;
//******************************************************
function App() {
  const debug = false;

//******************
//*   State Data   *
//******************
  
  // Nav boolean - show Search, or show Saved
  const [navIsSearch,setNavIsSearch] = useState();

  // The Search Form is supported by the search object.
  const [search,setSearch] = useState({
    title         : '',
    author        : '',
    subject       : ''
  });
  
  // Books are maintained in lists, each with an associated list index.

  // This is the list to hold search results.
  const [searchBooks,setSearchBooks] = useState({
    trigger : true,
    vols : []
  });

  // This is the list to hold saved books.
  const [savedBooks,setSavedBooks] = useState({
    trigger : true,
    vols : []
  });

//******************
//*   Functions    *
//******************
  
  // togglePage() changes the logic state of boolean navIsSearch.
  function togglePage() {
    setNavIsSearch(navIsSearch ? false : true);
  }

  // loadSavedBooks() fetches the DB content from the server.
  function loadSavedBooks() {
    fetch('/api/read')
    .then( (data) => {
      // data is the savedBooks array
      data.json().then( (res) => {
        let bArr = [];
        res.forEach( (book) => {
          bArr.push({
            added         : book.added,
            googleId      : book.googleId,
            title         : book.title, 
            subtitle      : book.subtitle? book.subtitle : '',
            authors       : book.authors,
            published     : book.published,
            imageUrl      : book.imageUrl,
            description   : book.description,
            viewDetails   : false
          });
        })
        if (debug) {console.log(`Saved books: ${bArr.length}`);}
        setSavedBooks({trigger:savedBooks.trigger+1,vols:bArr});
      })
    })
    .catch( (err) => console.log(err));
  }

  // handleFormChange() updates the search object as the user types
  // in the form fields. react renders them as they are changed.
  function handleFormChange(event) {
    event.preventDefault();
    // Get the value and name of the input which triggered the change
    const name  = event.target.name;
    const value = event.target.value;
    // And update the state so the user can see feedback as the input is typed.
    setSearch({...search, [name] : value});
  };

  // handleFormSubmit() asks for a Google Books search using the 
  // current value of the search object. the response list is converted 
  // to a books object, which tracks a selected index and an array of 
  // volume objects, each of which has some properties known from the 
  // search, and other properties which are not used until the user
  // selects to view the volume -- at which time those properties are 
  // found from a single-volume search.
  function handleFormSubmit(event) {
    event.preventDefault();

    API.getBooks(search)
    .then( (res) => {
      let bArr = [];
      if (res.data.items) {
        if (debug) {console.log(res.data.items);}
        let authorStr = '';
        let b = {};
        for (let i = 0; i < res.data.items.length; i++) {
          b = res.data.items[i];
          if (b.volumeInfo.authors) {
            authorStr = 
              b.volumeInfo.authors.reduce((s,elt,i) => (s += (!i ? elt : `, ${elt}`)) , '');
          } else {
            authorStr = '';
          }    
          bArr.push({
            added       : '',
            googleId    : b.id,
            title       : b.volumeInfo.title,
            subtitle    : '',
            authors     : authorStr,
            published   : '',
            imageUrl    : '',
            description : '',
            viewDetails : false
          });  
        }
      }
      setSearchBooks({trigger:searchBooks.trigger+1,vols:bArr});
      if (!navIsSearch) {
        setNavIsSearch(true);
      }
    })
    .catch( (err) => console.log(err));
  }
}
