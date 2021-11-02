const express=require('express');
const mysql=require('mysql');
const bp = require('body-parser');
const app=express();
app.use(bp.json());

const db = mysql.createConnection({
  host: '10.2.2.219',
  user: 'root',
  password: '123456788',
  database: 'his',
});
app.listen(8888);
console.log('Listening on port 8888...');

app.all('*', (request, response, next)=>{
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.get('/login', (request, response)=>{
  response.send('POST!');
});
app.post('/login', (request, response)=>{
  const sql='SELECT * from Doctors where id = ?';
  const params=[request.body['id']];
  db.query(sql, params, function(error, results) {
    if (error) {
      response.json({status: 'NO', error: error});
    }
    if (results.length > 0) {
      if (results[0]['password'] === request.body['password']) {
        response.cookie('user', 1, {maxAge: 10 * 60 * 1000, httpOnly: true});
        response.json({
          status: 'YES',
          type: results[0]['type'],
          name: results[0]['name'],
          room: results[0]['room'],
        });
      } else {
        response.json({
          status: 'NO',
          error: 'password error',
        });
      }
    } else {
      response.json({status: 'NO', error: 'id not found'});
    }
  });
});
app.post('/patient', (request, response)=>{
  if (request.body['operation'] === 'increase') {
    const patient = request.body['patientInfo'];
    const sql='SELECT * from Patients where id = ?';
    const params=[patient['id']];
    db.query(sql, params, function(error, results) {
      if (results.length === 0) {
        const sql='INSERT INTO Patients values (?,?,?,?)';
        const params=[
          patient['id'],
          patient['name'],
          patient['sex'],
          patient['disease'],
        ];
        db.query(sql, params, function(error) {
          if (error) {
            response.json({status: 'NO', error: error});
          }
          response.json({status: 'YES'});
        });
      } else {
        response.json({status: 'NO', error: '已存在id: '+patient['id']});
      }
    });
  }
  if (request.body['operation'] === 'delete') {
    const sql='DELETE from Patients where id = ?';
    const params=[request.body['id']];
    db.query(sql, params, function(error) {
      if (error) {
        response.json({status: 'NO', error: error});
      }
      response.json({status: 'YES'});
    });
  }
  if (request.body['operation'] === 'modify') {
    const sql='UPDATE Patients set name=? ,sex = ?,disease = ? where id = ?';
    const patient = request.body['patientInfo'];
    const params=[
      patient['name'],
      patient['sex'],
      patient['disease'],
      patient['id'],
    ];
    db.query(sql, params, function(error) {
      if (error) {
        response.json({status: 'NO', error: error});
      }
      response.json({status: 'YES'});
    });
  }
  if (request.body['operation'] === 'query') {
    const sql='SELECT * from Patients where id = ?';
    const params=[request.body['id']];
    db.query(sql, params, function(error, results) {
      if (error) {
        response.json({status: 'NO', error: error});
      }
      if (results.length > 0) {
        response.json({
          status: 'YES',
          id: results[0]['id'],
          name: results[0]['name'],
          sex: results[0]['sex'],
          disease: results[0]['disease'],
        });
      } else {
        response.json({status: 'NO', error: '找不到id!'});
      }
    });
  }
});
app.post('/pushRegisterQueue', (request, response)=>{
  const sql='SELECT clinic from Specialty where id=?';
  const params=[request.body['specialty']];
  db.query(sql, params, function(error, result) {
    const sql='INSERT INTO Queue values (?,?,?,?)';
    const params=[
      request.body['id'],
      result[0]['clinic'],
      request.body['specialty'],
      request.body['doctor']];
    db.query(sql, params, function(error) {
      if (error) {
        response.json({status: 'NO', error: error});
      }
      response.json({status: 'YES'});
    });
  });
});
app.post('/getDoctor', (request, response)=>{
  const sql='SELECT id as value ,name as label from Doctors where specialty=?';
  const params=[request.body['specialty']];
  db.query(sql, params, function(error, result) {
    if (error) {
      response.json({status: 'NO', error: error});
    }
    response.json({status: 'YES', doctor: result});
  });
});
app.get('/getClinicAndSpecialty', (request, response)=>{
  const json = [];
  let sql = 'SELECT * from Clinic';
  new Promise((resolve) => {
    db.query(sql, (error, clinicResults) => {
      if (error) {
        response.json({
          status: 'NO',
          error: error,
        });
      }
      resolve(clinicResults);
    });
  }).then(async (clinicResults) => {
    sql = 'SELECT id as value,name as label from Specialty where clinic = ?';
    for (let index = 0; index < clinicResults.length; index++) {
      await new Promise((resolve) => {
        db.query(sql, clinicResults[index]['id'],
            function(error, specialtyResults) {
              if (error) {
                response.json({
                  status: 'NO',
                  error: error,
                });
              } else {
                if (specialtyResults.length===0) {
                  json.push({
                    label: clinicResults[index]['name'],
                    value: clinicResults[index]['id'],
                  });
                } else {
                  json.push({
                    label: clinicResults[index]['name'],
                    value: clinicResults[index]['id'],
                    children: specialtyResults,
                  });
                }
                resolve();
              }
            },
        );
      });
    }
    response.json({
      status: 'YES',
      info: json,
    });
  });
});

app.get('/getRegisterQueue', (request, response)=>{
  const sql='SELECT Patients.id as patientID,name,sex,clinic,specialty ' +
      'FROM Patients,Queue ' +
      'WHERE Patients.id = Queue.id';
  db.query(sql, function(error, result) {
    if (error) {
      response.json({status: 'NO', error: error});
    }
    response.json({status: 'YES', patientsInfo: result});
  });
});

app.post('/popRegisterQueue', (request, response)=>{
  const sql='DELETE from Queue where id = ?';
  const params=[request.body['id']];
  db.query(sql, params, function(error) {
    if (error) {
      response.json({status: 'NO', error: error});
    }
    response.json({status: 'YES'});
  });
});

app.post('/clearRegisterQueue', (request, response)=>{
  const sql='SELECT Patients.id as patientID,name,sex,clinic,specialty ' +
      'FROM Patients,Queue ' +
      'WHERE Patients.id = Queue.id';
  db.query(sql, function(error, result) {
    if (error) {
      response.json({status: 'NO', error: error});
      return;
    }
    if (result.length===0) {
      response.json({status: 'YES'});
      return;
    }
    for (let index=0; index<result.length; index++) {
      const sql='DELETE from Queue where id = ?';
      const params=[result[index]['patientID']];
      db.query(sql, params, function(error) {
        if (error) {
          response.json({status: 'NO', error: error});
        }
      });
    }
    response.json({status: 'YES'});
  });
});
process.on('SIGINT', ()=>{
  db.end();
  console.log('Exiting...');
  process.exit();
});
