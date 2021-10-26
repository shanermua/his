const express=require('express');
const mysql=require('mysql');
const bp = require('body-parser');
const app=express();
app.use(bp.json());

const db = mysql.createConnection({
    host     : '10.2.2.219',
    user     : 'root',
    password : '123456788',
    database : 'his'
});
// db.connect();
app.listen(8888);
console.log('Listening on port 8888...');

app.all('*',(request,response,next)=>{
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST");
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.get('/login',(request,response)=>{
    response.send('POST!');
});
app.post('/login',(request,response)=>{
    let sql='SELECT * from Doctors where id = ?';
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
                response.json({
                    status: 'YES', type: results[0]['type'], name: results[0]['name'],room: results[0]['room']
                });
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
    if (request.body['operation'] === 'increase')
    {
        let patient = request.body['patientInfo'];
        let sql='SELECT * from Patients where id = ?';
        let params=[patient['id']];
        db.query(sql, params, function (error,results) {
            if (results.length === 0)
            {
                let sql='INSERT INTO Patients values (?,?,?,?)';
                let params=[patient['id'],patient['name'],patient['sex'],patient['disease']];
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
        let sql='UPDATE Patients set name=? ,sex = ?,disease = ? where id = ?';
        let patient = request.body['patientInfo'];
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
                response.json({status: 'NO', error:error});
            }
            if(results.length > 0)
            {
                response.json({
                    status: 'YES', id:results[0]['id'], name:results[0]['name'], sex:results[0]['sex'], disease:results[0]['disease']
                });
            }
            else
            {
                response.json({status: 'NO', error:'找不到id!'})
            }
        });
    }
});
app.post('/pushRegisterQueue',(request,response)=>{
    console.log(request.body)
    let sql='SELECT clinic from Specialty where id=?';
    let params=[request.body['specialty']];
    db.query(sql, params, function (error,result) {
        console.log(result)
        let sql='INSERT INTO Queue values (?,?,?,?)';
        let params=[request.body['id'],result[0]['clinic'],request.body['specialty'],request.body['doctor']];
        db.query(sql, params, function (error) {
            console.log(params)
            if (error) {
                response.json({status: 'NO', error:error});
            }
            response.json({status: 'YES'})
        });
    });


});
app.post('/getDoctor',(request,response)=>{
    let sql='SELECT id as value ,name as label from Doctors where specialty=?';
    let params=[request.body['specialty']];
    db.query(sql, params, function (error,result) {
        if (error) {
            response.json({status: 'NO', error:error});
        }
        response.json({status: 'YES', doctor:result});
    })
})
app.get('/getClinicAndSpecialty',(request,response)=>{
    let json = [];
    let sql = "SELECT * from Clinic";
    new Promise((resolve) => {
        db.query(sql, (error, clinicResults) => {
            if (error)
            {
                response.json({
                    status: 'NO',
                    error: error
                });
            }
            resolve(clinicResults);
        });
    }).then(async (clinicResults) => {
        sql = "SELECT id as value,name as label from Specialty where clinic = ?";
        for (let index = 0; index < clinicResults.length; index++) {
            await new Promise((resolve) => {
                db.query(sql,clinicResults[index]["id"],
                    function (error, specialtyResults) {
                        if (error)
                        {
                            response.json({
                                status: 'NO',
                                error: error
                            });
                        }
                        else
                        {
                            console.log(specialtyResults)
                            if (specialtyResults.length===0)
                            {
                                json.push({
                                    label: clinicResults[index]["name"],
                                    value: clinicResults[index]["id"]
                                });
                            }
                            else
                            {
                                json.push({
                                    label: clinicResults[index]["name"],
                                    value: clinicResults[index]["id"],
                                    children: specialtyResults,
                                });
                            }
                            resolve();
                        }
                    }
                );
            });
        }
        response.json({
            status: 'YES',
            info: json
        });
    })
});



process.on('SIGINT',()=>{
    db.end();
    console.log('Exiting...');
    process.exit();
})