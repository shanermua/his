const express=require('express');
const sha256=require('sha256');
const mysql=require('mysql');
const bp = require('body-parser');
const app=express()
app.use(bp.urlencoded({extended: false}))
const databese = mysql.createConnection({
    host     : '10.5.98.242',
    user     : 'root',
    password : '123456788',
    database : 'his'
});
databese.connect();
// databese.query('SELECT * from Users', function(error, results, fields) {
//     if (error) throw error;
//     console.log(results);
// });
app.listen(80);
console.log('Listening on port 80...');
// app.get('/login',(request,response)=>{
//     // console.log(request.header('cookie'));
//     // response.setHeader("set-cookie",'');
//     response.json('hello');
// })
app.post('/login',(request,response)=>{
    // console.log(request.header('cookie'));
    // response.setHeader("set-cookie",'');
    // console.log(request.body);
    // response.send(request.body['id']);
    databese.query('SELECT password,type from Users where id=' + request.body['id'], function(error, results, fields) {
        if (error) throw error;
        // console.log(results);
        // console.log(sha256(results[0]['password']));
        // console.log(request.body['password']);
        if(sha256(results[0]['password']) === request.body['password'])
        {
            response.cookie('user',1,{expires: new Date(Date.now() + 100),httpOnly: true});
            response.json({login: 'yes', type: results[0]['type']});
        }else{
            response.json({login:'no'});
        }
    });
    // console.log(request.body['id']);
})