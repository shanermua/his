const express=require('express');
const mysql=require('mysql');
const bp = require('body-parser');
const app=express();
app.use(bp.json());
// app.use(bp.urlencoded({extended: false}))

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
    console.log(request.body);
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST");
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // response.send('ok');
    next();
});
app.get('/login',(request,response)=>{
    response.send('POST!');
});
app.post('/login',(request,response)=>{
    let sql='SELECT * from Users where id = ?';
    let params=[request.body['id']];
    db.query(sql, params, function (error,results) {
        if (error)
        {
            response.json({status: 'NO', error:error});
        }
        if(results.length > 0)
        {
            if(results[0]['password'] === request.body['password'])
            {
                response.cookie('user',1,{maxAge: 10 * 60 * 1000, httpOnly: true});
                response.json({status: 'YES', type: results[0]['type'], name: results[0]['name'],room: results[0]['room']});
            }else{
                response.json({status: 'NO', error:'password error'});
            }
        }
        else
        {
            response.json({status: 'NO', error:'id not found'});
        }
    });
});
app.post('/patient',(request,response)=>{
    // console.log(request.body);
    if (request.body['operation'] === 'increase')
    {
        let patient = request.body['patientInfo'];
        let sql='SELECT * from Patients where id = ?';
        let params=[patient['id']];
        db.query(sql, params, function (error,results) {
            if (results.length === 0)
            {
                let sql='INSERT INTO Patients values (?,?,?,?)';

                // console.log(patient)
                let params=[patient['id'],patient['name'],patient['sex'],patient['disease']];
                // let params=[request.body['id'], request.body['name'], request.body['sex'], request.body['disease']];
                db.query(sql, params, function (error) {
                    if (error) {
                        response.json({status: 'NO', error:error});
                    }
                    response.json({status: 'YES'})
                });
            }
            else
            {
                response.json({status: 'NO', error:"已存在id: "+patient['id']});
            }
        });

    }
    if (request.body['operation'] === 'delete')
    {
        let sql='DELETE from Patients where id = ?';
        let params=[request.body['id']];
        db.query(sql, params, function (error) {
            if (error)
            {
                response.json({status: 'NO', error:error});
            }
            response.json({status: 'YES'})
        });
    }
    if (request.body['operation'] === 'modify')
    {
        // console.log(request.body['patientInfo']);
        let sql='UPDATE Patients set name=? ,sex = ?,disease = ? where id = ?';
        let patient = request.body['patientInfo'];
        // console.log(patient)
        let params=[patient['name'],patient['sex'],patient['disease'],patient['id']];
        db.query(sql, params, function (error) {
            if (error)
            {
                response.json({status: 'NO', error:error});
            }
            response.json({status: 'YES'});
        });
    }
    if (request.body['operation'] === 'query')
    {
        let sql='SELECT * from Patients where id = ?';
        let params=[request.body['id']];
        db.query(sql, params, function (error,results) {
            if (error)
            {
                response.json({status: 'ERROR', error:error});
            }
            if(results.length > 0)
            {
                response.json({status: 'YES', id:results[0]['id'], name:results[0]['name'], sex:results[0]['sex'], disease:results[0]['disease']});
            }
            else
            {
                response.json({status: 'NO', error:'找不到id!'})
            }
        });
    }
});