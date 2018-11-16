# Token Authentication Meeting 

## Security

- passing credentials in the request body or even headers is deemed "insecure"
- randomly generated tokens are encouraged
- tokens have a short expiration date so there's less of an exposure
- you may refresh them if needed
- this is how you get a session
    - save a `{email: nl253@kent.ac.uk, token: 234jklkjfalksdjfl}`{.javascript} record in the database
    - each time someone wants to modify the `nl253@kent.ac.uk` profile, check that they have the token
    - the token must match and it must be "fresh"
- at the moment I am sending hashed (still insecure) credentials in the request body and cookie
    - the API is not very consistent in that it checks for both
    - this makes it a bit painful to code and test
- `fetch()`{.javascript} will help us improve UX since we won't have to reload the page e.g.: during authentication or when modifying user's details in the DB
    - doesn't allow to set cookies (problematic with authentication and maintaining sessions)

## Routing

### UI (Rendering Web Pages)

  **Action**                                      **Method** **URL**                    **Redirects**                                                                             **Must Sign-In** **Notes** 
  ----------------------------------------------- ---------- -------------------------- ----------------------------------------------------------------------------------------- ---------------- ------------------------------------------------------------------------------------------------------------------
  browse through modules (and filter)             GET        `/module/search`           --                                                                                        No               Use query parameters e.g.: `/module/search?topic=ai&author=nl253@kent.ac.uk` to display a filtered list of modules
  users dashboard (created module, enrollments)   GET        `/user/<email>`            `/user/<email>/dashboard`, `/user/<email>/home`, `/user/<email>/profile`                  Yes              --
  register                                        POST       `/user/register`           `/register`                                                                               No               This is the current `index.hbs`
  browse through users & filter                   GET        `/user/search`             --                                                                                        No               Use query parameters like when searching for modules

### AJAX

  **Action**                                      **Method** **URL**                              **Requires Token** **Notes**
  ----------------------------------------------- ---------- ------------------------------------ ------------------ ------------------------------------------------------------------------------------------------------------------
  list modules & filter by criteria               GET        `/api/module`                        No                 Use query parameters e.g.: `/module/search?topic=ai&author=nl253@kent.ac.uk` to display a filtered list of modules
  list users & filter by criteria                 GET        `/api/module`                        No                 Use query parameters like in `/api/module`
  user info                                       GET        `/api/user/<email>`                  No                 --
  user info for specific property                 GET        `/api/user/<email>/<property>`       No                 --
  module info for specific property               GET        `/api/module/<email>/<property>`     No                 --
  module info                                     GET        `/api/module/<name>`                 No                 --
  modify user's info                              POST       `/api/user/<email>/<property>`       Yes                POST because the data could be password so it needs to be sent in the request body
  modify module's info                            POST       `/api/module/<name>/<property>`      Yes                POST because the data could be password so it needs to be sent in the request body
  register                                        POST       `/api/user/register`                 No                 POST because the credentials need to be sent in the request body
  unregister                                      GET        `/api/user/unregister`               Yes                GET because token will be passed in cookies
  log a user in (begins session, send token)      POST       `/api/user/login`                    No                 POST because credentials are sent in the request body and GET doesn't allow that 
  log a user out (end session, clear token)       GET        `/api/user/logout`                   Yes                GET because token will be passed in cookies, just clear the session that corresponds to that token

## Authentication

1. Make a `Session` table with `email STRING PRIMARY KEY`{.sql}, `token STRING NOT NULL`{.sql} columns where a random `token` is generated and only one token is associated with one user.
2. Have the database keep track of modification date (for checking if still fresh). Set the `maxAge`{.javascript} of cookies to, say, 20 min, refresh them on every interaction.
3. On logging in (via POST with credentials in the body) pass newly generated token in the request body `{result: <TOKEN>, message: "successfully authenticated"}`{.javascript}.
4. This will be an AJAX call so you'll have to get the requested token and save it in cookies, then redirect to, say, `/user/<email>`.
5. `Cookie` is a header sent with an HTTP request
    - HTTP requests have their own little language with characters such as `;` and `:` delimiting fields 
    - as a result there are restrictions on what characters can go inside cookies
    - for that I am using base64 encoding (ensures ASCII) and `urlDecode(s)` and `urlEncode(s)` (see `setCookie(s)` and `getCookie(s)` which will do all of that for you)
4. Everything from that point requires the token to be passed in cookies e.g.: `Cookie: token=12lk3jlkejdfsl543lj2l34 ; email=nl253%40kent.ac.uk` and in JS `document.cookie === 'token=12lk3jlkejdfsl543lj2l34 ; email=nl253%40kent.ac.uk'`{.javascript}
5. Each action that require checking of the token value refreshes it by 20min.
6. If you request access to a resource for, say, `nl253@kent.ac.uk` but you don't have a fresh token you'll be denied access and it will ask to log in again.
7. Logging in again will replace the old token with a new one in effect invalidating the old one so that only one client has modification access to one account.

## Choices

1. Pass credentials / the token in the request body (requires POST)
3. Pass credentials / token in the URL in a GET request e.g.: `/user/profile?email=nl253@kent.ac.uk&password=pass123` or `/user/nl253@kent.ac.uk&token=21lk34j1j2lk` (very insecure)
4. Pass credentials / token in the `Authorization` header
    - not easy to extract it
    - doesn't seem to be commonly used
    - some authentication protocols require that the token goes here
    - But Reddit sends the token in cookies! (go to `https://www.reddit.com/` and type in the JS console `document.cookie`{.javascript})
    - `Basic` authentication sends credentials like `Authorization: Basic username:password` (very insecure)
    - `Token` / `Bearer` authentication sends the token (`Authorization: Bearer asldkj21l3kj4lk12rjl`)
6. Pass credentials / the token in cookies (still a bit insecure e.g.: `Cookie: token=12lk3jlkejdfsl543lj2l34 ; email=nl253%40kent.ac.uk`)

**Note**

The token and credentials *can* be encrypted but I haven't done that yet.

## Issues

1. HTTP forms don't allow you to set headers!
2. You can send a request to the server to set a cookie for you or you can do it yourself in JS but you **cannot** have the server set `Set-Cookie` header with `fetch(url, cfg)` (AJAX).
3. How to authenticate?
    - You don't want to first do an AJAX request to check if user exists (current `index.hbs`) and then fire a POST request to log in (AGAIN...) so that it sets the cookies
4. how to check if logged in with AJAX
    - checking if cookie set is not enough
    - you need to check if the token is *still* valid
    - you might need to rely on HTTP error codes when you try to perform some action.
        - e.g. you try to change password but you get `code === 404`, so you ask the user to log in again
5. page reload will still be necessary AFTER you successfully authenticate

## Conclusions

- the token must be made accessible from JS after authentication because JS will make the AJAX calls
    - this can be stored in `document.cookies`{.javascript} (a bit awkward to deal with)
    - I have written helper functions to set and get cookie vaules
        - `setCookie(name, vallue)`
        - `getCookie(name)`
    - note the odd `document.cookie` behaviour
- when you request a page / a service that requires authentication, you need to provide the token

## Look Into

- encryption of the token
- base64 encoding
- token-based authentication
- oauth2
- <https://tools.ietf.org/html/rfc6750>

<!-- 
vim:fo=:conceallevel=0:
-->
