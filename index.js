const express = require('express');
const app =express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req,res) => {
    res.json({message: 'Hello API !'});

});
app.get('/hello/:name',(req,res) => {
    res.json({message: `Hello ${req.params.name}`});

});

app.post('/echo',(req,res)=>{
    res.json({youSent: req.body});
 });

 app.listen(PORT,()=>{
    console.log(`Server is runnig on port ${PORT}`);
 });
