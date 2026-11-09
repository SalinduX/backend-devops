const express =require("express");
const pool =require('./db');
const app=express();
const PORT =3000;
const {validate, createTodoSchema, updateTodoSchema, listQuerySchema} = require('./validate');

app.use(express.json());

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



app.get('/todos', validate(listQuerySchema, 'query'),asyncHandler(async(req,res)=>{
    const {done , search , page, limit} =req.valid.query;
    const conditions=[];
    const values=[];
    if(done !== undefined){
        values.push(done === 'true');
        conditions.push(`done = $${values.length}`);
    }
    if (search){
        values.push(`%${search}%`);
        conditions.push(`title ILIKE $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(`SELECT COUNT(*) FROM todos ${where}`,values);
    const total = Number(countResult.rows[0].count);


    values.push(limit,(page -1)* limit);


    const {rows }=await pool.query(`SELECT * FROM todos ${where} ORDER BY id LIMIT $${values.length - 1} OFFSET $${values.length}`, values); 
    res.json({page, limit,total,totalPages: Math.ceil(total/limit),data:rows});
}));



app.get('/todos/:id',validateId,asyncHandler(async (req,res) => {

    const {rows} = await pool.query(`SELECT *FROM todos WHERE id = $1`,[req.todoId]); 
    if(rows.length === 0){
        const err = new Error('Todo not found');
        err.status = 404;
        throw err;
    }
    res.json(rows[0]);
}));

app.post('/todos',validate(createTodoSchema),asyncHandler(async(req,res) =>{

    const {rows} =await pool.query(
`INSERT INTO todos (title) VALUES ($1) RETURNING *`,[req.valid.body.title]
    );
    res.status(201).json(rows[0]);
}));


app.put('/todos/:id',validateId,validate(updateTodoSchema),asyncHandler(async(req,res) =>{
    
    const {title,done} = req.valid.body;

    const {rows} = await pool.query(
        `UPDATE todos 
        SET title = COALESCE($1, title),
            done = COALESCE($2,done)
        WHERE id = $3 
        RETURNING *`,[title ?? null, done ?? null, req.todoId]
    );
    
    
     if(rows.length === 0){
        const err = new Error('Todo not found');
        err.status = 404;
        throw err;
    }
    res.json(rows[0]);
}));

app.delete('/todos/:id', validateId, asyncHandler(async(req,res)=>{


    const {rowCount} = await pool.query(`DELETE FROM todos WHERE id = $1`,[req.todoId]);
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