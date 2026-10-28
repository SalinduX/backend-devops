const express = require('express');
const app= express();
const PORT =  3000;

app.use(express.json());

let todos =[
    {id:1, title: 'Learn Node.js', done: false},
    {id:2, title: 'Build a REST API', done: false},
    {id:3, title: 'Test the API', done: false     }
];
let nextId = 4;

app.get('/todos',(req,res)=>{
    const {done} =req.query;
    if(done !== undefined){
        return res.json(todos.filter(t=> t.done === (done === 'true')))
}
res.json(todos);
});

app.get('/todos/:id', (req,res) => {
    const todo = todos.find(t=> t.id === Number(req.params.id));
    if(!todo) return res.status(404).json({error:'Todo not found'});
    res.json(todo);
});

app.post('/todos',(req,res) =>{
    const {title} = req.body;
    if(!title || typeof title != 'string') {
        return res.status(400).json({error: 'Title is required'}); 
}
const todo = {id:nextId++, title, done: false};
todos.push(todo);
res.status(201).json(todo);
});

app.put('/todos/:id',(req,res) =>{
    const todo = todos.find(t=>  t.id === Number(req.params.id));
    if(!todo) return res.status(404).json({error: 'Todo not found' });

        const {title,done}=req.body;
        if(title !=undefined) todo.title =title;
        if(done !=undefined) todo.done =done;
        res.json(todo);
        });

app.delete('/todos/:id',(req,res)=>{
    const index = todos.findIndex(t=> t.id=== Number(req.params.id));
    if(index === -1) return res.status(404).json({error:'Todo not found'});
    todos.splice(index,1);
    res.status(204).send();
});



app.listen(PORT,() =>{
    console.log(`Server runnig on http://localhost:${PORT}`);
});