#!/usr/bin/env node

// Web crawl WikkaWiki all pages to storage directory.
const wc = require('needle')
const url = require('url');

const baseURL = process.env.crawlerBaseURL;
const loginInfo = { password:process.env.crawlerPassword, name:process.env.crawlerUser, };
const pageList = `${__dirname}/PageList.txt`;

// Log in to the wiki through the UserSettings page

wc(`get`, `${baseURL}UserSettings`) 

    .then(r=>{ // this gets us a nonced login form
        let formData = {  };
        
        // Collect all the form's initialized values
        new (require('jsdom').JSDOM)(r.body).window.document
            .querySelector('#content') // div with id = content
            .querySelector('form') // first form at the top of the page (login)
            .querySelectorAll('input') // All the input elements we need to complete the form
            .forEach(i=>formData[i.getAttribute('name')]=i.getAttribute('value')); 
        
        // Then add in our authentication information
        Object.assign(formData, loginInfo);
        let params = new url.URLSearchParams(formData);
        //console.log(`${params}`);
        return wc('post', `${baseURL}UserSettings`, `${params}`, { follow_set_cookies:true, });
        /**
         * This login request includes a redirect to any wiki page (UserSettings because unspecified.)
         * Because we set follow_set_cookies:true as a request option, needle sets the cookies it receives 
         * from this login during the redirect and we can see those cookies in r.cookies below.
         * That's important, because then we just include the cookies:r.cookies option on the page requests 
         * and each is authorized.
         */
    })

// Now process a list of wiki pages to download each one

    .then(r=>{
        require('fs').readFileSync(pageList).toString()
            .split(`\n`).forEach(name=>{
                if ((name = name.trim()).length) {
                    console.log(`Page ${name} requested`);
                    wc('get', `${baseURL}${name}`, { cookies:r.cookies, output:`${__dirname}/downloads/${name}.html` })
                        .then(r=>console.log(`Page ${name} downloaded.`));
                }
            });
    })
    .catch(e=>{ console.log(e); throw e });
