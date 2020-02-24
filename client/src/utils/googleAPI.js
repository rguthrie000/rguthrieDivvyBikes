// Google Books API interface
// These functions return a Promise; use .then() and .catch to 
// use their (res, err) responses.
//

import axios from "axios";
const debug = false;

const BASE_URL = `https://www.googleapis.com/books/v1/volumes`;

function getBooks(matchObj) {
  const maxVolumes = 40; // Google Books' default is 10, max is 40
  let queryStr = `${BASE_URL}?q=`;
  let matchStr = '';
  // Search by any combination of Title, Author, and/or Subject
  if (matchObj.title) {
    // No spaces allowed in the URL...replace each space with '+'
    matchStr = matchObj.title.replace(/\s/g,'+');
    // And add to the string
    queryStr += `intitle:${matchStr}`;
  }
  if (matchObj.author) {
    // If a title was also specified, add a '+' before the author
    if (matchObj.title) {
        queryStr += `+`;
    }
    matchStr = matchObj.author.replace(/\s/g,'+');
    queryStr += `inauthor:${matchStr}`;
  }
  if (matchObj.subject) {
    // if a title or an author is present, need a '+'
    if (matchObj.title || matchObj.author) {
        queryStr += `+`;
    }
    matchStr = matchObj.subject.replace(/\s/g,'+');
    queryStr += `subject:${matchStr}`;
  }
  // Finally, specify books-only, and specify our results cap
  queryStr += `&printType=books&maxResults=${maxVolumes}`;
  if (debug) {console.log(`Books Query: ${queryStr}`);}
  // Let's see what's out there.
  return(axios.get(queryStr));
}

// getVolume() uses volumeId from one of the volumes found by
// getBooks(). as such, volumeId does not need validation.
function getVolume(volumeId) {
  let queryStr = `${BASE_URL}/${volumeId}?`;
  if (debug) {console.log(`Single Book Query: ${queryStr}`);}
  return(axios.get(queryStr));
}

export default {getBooks, getVolume};

// Response documentation from Google:
//
// response to getBooks()
//
// {
//  "kind": "books#volumes",
//  "items": [
//   {
//    "kind": "books#volume",
//    "id": "_ojXNuzgHRcC",
//    "etag": "OTD2tB19qn4",
//    "selfLink": "https://www.googleapis.com/books/v1/volumes/_ojXNuzgHRcC",
//    "volumeInfo": {
//     "title": "Flowers",
//     "authors": [
//      "Vijaya Khisty Bodach"
//     ],
// //    ...
//   },
//   {
//    "kind": "books#volume",
//    "id": "RJxWIQOvoZUC",
//    "etag": "NsxMT6kCCVs",
//    "selfLink": "https://www.googleapis.com/books/v1/volumes/RJxWIQOvoZUC",
//    "volumeInfo": {
//     "title": "Flowers",
//     "authors": [
//      "Gail Saunders-Smith"
//     ],
//     // ...
//   },
//   {
//    "kind": "books#volume",
//    "id": "zaRoX10_UsMC",
//    "etag": "pm1sLMgKfMA",
//    "selfLink": "https://www.googleapis.com/books/v1/volumes/zaRoX10_UsMC",
//    "volumeInfo": {
//     "title": "Flowers",
//     "authors": [
//      "Paul McEvoy"
//     ],
//     ...
//   },
//   "totalItems": 3
// }

// response to getVolume()
//
// {
//  "kind": "books#volume",
//  "id": "zyTCAlFPjgYC",
//  "etag": "f0zKg75Mx/I",
//  "selfLink": "https://www.googleapis.com/books/v1/volumes/zyTCAlFPjgYC",
//  "volumeInfo": {
//   "title": "The Google story",
//   "authors": [
//    "David A. Vise",
//    "Mark Malseed"
//   ],
//   "publisher": "Random House Digital, Inc.",
//   "publishedDate": "2005-11-15",
//   "description": "\"Here is the story behind one of the most remarkable Internet
//   successes of our time. Based on scrupulous research and extraordinary access
//   to Google, ...",
//   "industryIdentifiers": [
//    {
//     "type": "ISBN_10",
//     "identifier": "055380457X"
//    },
//    {
//     "type": "ISBN_13",
//     "identifier": "9780553804577"
//    }
//   ],
//   "pageCount": 207,
//   "dimensions": {
//    "height": "24.00 cm",
//    "width": "16.03 cm",
//    "thickness": "2.74 cm"
//   },
//   "printType": "BOOK",
//   "mainCategory": "Business & Economics / Entrepreneurship",
//   "categories": [
//    "Browsers (Computer programs)",
//    ...
//   ],
//   "averageRating": 3.5,
//   "ratingsCount": 136,
//   "contentVersion": "1.1.0.0.preview.2",
//   "imageLinks": {
//    "smallThumbnail": "https://books.google.com/books?id=zyTCAlFPjgYC&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api",
//    "thumbnail": "https://books.google.com/books?id=zyTCAlFPjgYC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
//    "small": "https://books.google.com/books?id=zyTCAlFPjgYC&printsec=frontcover&img=1&zoom=2&edge=curl&source=gbs_api",
//    "medium": "https://books.google.com/books?id=zyTCAlFPjgYC&printsec=frontcover&img=1&zoom=3&edge=curl&source=gbs_api",
//    "large": "https://books.google.com/books?id=zyTCAlFPjgYC&printsec=frontcover&img=1&zoom=4&edge=curl&source=gbs_api",
//    "extraLarge": "https://books.google.com/books?id=zyTCAlFPjgYC&printsec=frontcover&img=1&zoom=6&edge=curl&source=gbs_api"
//   },
//   "language": "en",
//   "infoLink": "https://books.google.com/books?id=zyTCAlFPjgYC&ie=ISO-8859-1&source=gbs_api",
//   "canonicalVolumeLink": "https://books.google.com/books/about/The_Google_story.html?id=zyTCAlFPjgYC"
//  },
//  "saleInfo": {
//   "country": "US",
//   "saleability": "FOR_SALE",
//   "isEbook": true,
//   "listPrice": {
//    "amount": 11.99,
//    "currencyCode": "USD"
//   },
//   "retailPrice": {
//    "amount": 11.99,
//    "currencyCode": "USD"
//   },
//   "buyLink": "https://books.google.com/books?id=zyTCAlFPjgYC&ie=ISO-8859-1&buy=&source=gbs_api"
//  },
//  "accessInfo": {
//   "country": "US",
//   "viewability": "PARTIAL",
//   "embeddable": true,
//   "publicDomain": false,
//   "textToSpeechPermission": "ALLOWED_FOR_ACCESSIBILITY",
//   "epub": {
//    "isAvailable": true,
//    "acsTokenLink": "https://books.google.com/books/download/The_Google_story-sample-epub.acsm?id=zyTCAlFPjgYC&format=epub&output=acs4_fulfillment_token&dl_type=sample&source=gbs_api"
//   },
//   "pdf": {
//    "isAvailable": false
//   },
//   "accessViewStatus": "SAMPLE"
//  }
// }