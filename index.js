const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {requireAuth} = require('./auth');
const express =require("express");
const pool =require('./db');
const app=express();
const PORT =3000;
const {validate, createTodoSchema, updateTodoSchema, listQuerySchema, registerScheama, loginSchema} = require('./validate');

app.use(express.json());

if(!process.env.JWT_SECRET){
    console.error('JWT_SECRET is not set in environment variables');
    process.exit(1);
}

app.use((req,res,next)=>{
    const start =Date.now();

    res.on('finish',() =>{
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);

    });
    next();

});

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);


function validateId(req,res,next){
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <  1){
        const err = new Error('id must be a positive integer');
        err.status=400;
        return next(err);
    }
    req.todoId = id;
    next();

}

    app.get('/health',asyncHandler(async(req,res)=>{
        await pool.query('SELECT 1');
        res.json({status:'ok',db:'connected',uptime: process.uptime()});
    }));

    app.post('/auth/register',validate(registerScheama),asyncHandler(async(req,res) =>{
        const {email,password} = req.valid.body;
        const passwordHash = await bcrypt.hash(password,10);

        try{
            const {rows} = await pool.query(
                'INSERT INTO users (email,password_hash) VALUES ($1,$2) RETURNING id,email,created_at',
                [email, passwordHash]
            );
            res.status(201).json(rows[0]);
        }catch(e){
            if(e.code === '23505'){
                const err = new Error('Email already exists');
                err.status = 409;
                throw err;
            }
            throw err;
        }
    }));

    app.post('/auth/login',validate(loginSchema),asyncHandler(async (req,res)=>{
        const {email,password} = req.valid.body;
        const {rows} = await pool.query('SELECT * FROM users WHERE email = $1',[email]);
        const user =rows[0];

        const ok = user && (await bcrypt.compare(password,user.password_hash));
        if(!ok){
            const err = new Error('Invalid email or password');
            err.status = 401;
            throw err;
        }

        const token = jwt.sign({id:user.id},process.env.JWT_SECRET,{expiresIn:'1h'});
        res.json({token});
    }));

    app.get('/auth/me',requireAuth,asyncHandler(async (req,res)=>{
        const {rows} = await pool.query(
            'SELECT id,email, created_at FROM users WHERE id =$1',[req.user.id]);
        res.json(rows[0]);
    }));

app.get('/todos', requireAuth,validate(listQuerySchema, 'query'),asyncHandler(async(req,res)=>{
    const {done , search , page, limit} =req.valid.query;
    const conditions=['user_id = $1'];
    const values=[req.user.id];

    if(done !== undefined){
        values.push(done === 'true');
        conditions.push(`done = $${values.length}`);
    }
    if (search){
        values.push(`%${search}%`);
        conditions.push(`title ILIKE $${values.length}`);
    }
    const where =  `WHERE ${conditions.join(' AND ')}`;
    const countResult = await pool.query(`SELECT COUNT(*) FROM todos ${where}`,values);
    const total = Number(countResult.rows[0].count);


    values.push(limit,(page -1)* limit);


    const {rows }=await pool.query(`SELECT * FROM todos ${where} ORDER BY id LIMIT $${values.length - 1} OFFSET $${values.length}`, values); 
    res.json({page, limit,total,totalPages: Math.ceil(total/limit),data:rows});
}));



app.get('/todos/:id',requireAuth,validateId,asyncHandler(async (req,res) => {

    const {rows} = await pool.query(`SELECT *FROM todos WHERE id = $1 AND user_id =$2`,[req.todoId, req.user.id]);

    if(rows.length === 0){
        const err = new Error('Todo not found');
        err.status = 404;
        throw err;
    }
    res.json(rows[0]);
}));

app.post('/todos',requireAuth,validate(createTodoSchema),asyncHandler(async(req,res) =>{

    const {rows} =await pool.query(
`INSERT INTO todos (title, user_id) VALUES ($1, $2) RETURNING *`,[req.valid.body.title, req.user.id]
    );
    res.status(201).json(rows[0]);
}));


app.put('/todos/:id',requireAuth,validateId,validate(updateTodoSchema),asyncHandler(async(req,res) =>{
    
    const {title,done} = req.valid.body;

    const {rows} = await pool.query(
        `UPDATE todos 
        SET title = COALESCE($1, title),
            done = COALESCE($2,done)
        WHERE id = $3 AND user_id =$4
        RETURNING *`,[title ?? null, done ?? null, req.todoId, req.user.id]
    );
    
    
     if(rows.length === 0){
        const err = new Error('Todo not found');
        err.status = 404;
        throw err;
    }
    res.json(rows[0]);
}));

app.delete('/todos/:id',requireAuth, validateId, asyncHandler(async(req,res)=>{


    const {rowCount} = await pool.query(`DELETE FROM todos WHERE id = $1 AND user_id = $2`,[req.todoId, req.user.id]);
    if(rowCount === 0){
        const err = new Error('Todo not found');
        err.status = 404;
        throw err;
    } 
    res.status(204).send();
}));

app.use((req,res,next)=>{
    const err = new Error(`Route ${req.method} ${req.originalUrl} not found`);
    err.status =404;
    next(err);
})

app.use((err,req,res,next)=>{
    const status=err.status || 500;
    res.status(status).json({
        error:status===500 ? 'Internal Server Error' : err.message,
    });
    if(status===500)
        console.error(err);
});


app.listen(PORT,() =>{
    console.log(`Server runnig on http://localhost:${PORT}`);
});