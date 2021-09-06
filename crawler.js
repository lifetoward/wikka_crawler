#!/usr/bin/env node

// Web crawl WikkaWiki all pages to storage as HTML only in a local filesystem.

const baseURL = process.env.crawlerBaseURL;
const loginInfo = { password:process.env.crawlerPassword, name:process.env.crawlerUser, };
const pageList = `${__dirname}/PageList.txt`;

const wc = require('needle'); // needle includes some nice shortcuts and features to simplify web form login

// Begin with getting the empty login form which includes nonces, etc.

wc(`get`, `${baseURL}UserSettings`) 

.then(r=>{

    let formData = {  };
    
    // Collect all the form's initialized values
    new (require('jsdom').JSDOM)(r.body).window.document
        .querySelector('#content') // div with id = content
        .querySelector('form') // first form at the top of the page (login)
        .querySelectorAll('input') // All the input elements we need to complete the form
        .forEach(i=>formData[i.getAttribute('name')]=i.getAttribute('value')); 
    
    // Then add in our authentication information
    Object.assign(formData, loginInfo);
    
// Submit the login form, setting cookies from the response
    
    return wc('post', `${baseURL}UserSettings`, `${new (require('url')).URLSearchParams(formData)}`, { follow_set_cookies:true, });
    /**
     * This login request includes a redirect to any wiki page (UserSettings because unspecified.)
     * Because we set follow_set_cookies:true as a request option, needle sets the cookies it receives 
     * from this login during the redirect and we can see those cookies in r.cookies below.
     * That's important, because then we just include the cookies:r.cookies option on the page requests 
     * and each is authorized.
     */
})

// Now load the list of wiki pages to download each one

.then(r=>require('fs').readFileSync(pageList).toString().split(`\n`)

    .forEach(name=>{
        if ((name = name.trim()).length) {
            console.log(`${name} requested`);

// Request each page asynchronously, using needle to save each to a file as it's received.

            wc('get', `${baseURL}${name}`, { cookies:r.cookies, output:`${__dirname}/downloads/${name}.html` })
                .then(r=>console.log(`... ${name} downloaded.`));
        }
    })

)
