const express=require('express');
const mysql=require('mysql');
const bp = require('body-parser');
const app=express()
app.use(bp.urlencoded({extended: false}))

const db = mysql.createConnection({
    host     : '10.2.2.219',
    user     : 'root',
    password : '123456788',
    database : 'his'
});
db.connect();
app.listen(8888);
console.log('Listening on port 8888...');

app.all('*',(request,response,next)=>{

    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "*");
    console.log('all');
    next();
});
app.get('/login',(request,response)=>{
    response.send('POST!');
});
app.post('/login',(request,response)=>{
    db.query('SELECT * from Users where id="' + request.body['id'] + '"', function (error,results) {
        if (error) throw error;
        if(results.length > 0)
        {
            if(results[0]['password'] === request.body['password'])
            {
                response.cookie('user',1,{maxAge: 10 * 60 * 1000, httpOnly: true});
                response.json({status: 'OK', login: 'yes', type: results[0]['type'], name: results[0]['name'],room: results[0]['room']});
            }else{
                response.json({status: 'OK', login:'password error'});
            }
        }
        else
        {
            response.json({status: 'OK', login:'id not found'});
        }
    });
});
app.post('/patient',(request,response)=>{
    console.log(request.body)
    if (request.body['operation'] === 'add')
    {
        db.query('INSERT INTO Patients values ("' + request.body['id'] + '", "' + request.body['name'] + '", "' +
            request.body['sex'] + '", "' + request.body['disease'] + '")', function (error) {
            if (error) throw error;
            response.json({status: 'OK'})
        });
    }
    if (request.body['operation'] === 'delete')
    {
        db.query('DELETE from Patients where id="'+request.body['id'] + '"', function (error) {
            if (error) throw error;
            response.json({status: 'OK'})
        });
    }
    if (request.body['operation'] === 'modify')
    {
        db.query('UPDATE Patients set id', function (error) {
            if (error) throw error;
            response.json({status: 'OK'})
        });
    }
});