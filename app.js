// Imports
const express = require('express');
const mysql = require('mysql2');
const fileupload = require('express-fileupload');
const {engine} = require('express-handlebars');
const fs = require('fs');

// Pegando os dados do express
const app = express();

// Pegando os dados do fileupload
app.use(fileupload());

// Adicionando caminho bootsatrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

// Indicando a pasta de imagens
app.use('/imagens', express.static('./imagens'));

// Pegando dados do HTML Handlebars
app.engine('handlebars', engine({
    helpers: {
      // Função auxiliar para verificar igualdade
      condicionalIgualdade: function (parametro1, parametro2, options) {
        return parametro1 === parametro2 ? options.fn(this) : options.inverse(this);
      }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Manipulando dados das rotas
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Config e conexão DB
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'brunno33',
    database: 'projetoroupas'
});

conexao.connect(function(erro) {
    if(erro) throw erro;
    console.log('Conexão efetuada com sucesso');

});

// Rota de renderização de imagem
app.get('/', function(req, res) {
    let sql = 'SELECT * FROM produtos';

    conexao.query(sql, function(erro, retorno) {
        res.render('formulario', {produtos: retorno});
    })
});

// Rota principal com msg
app.get('/:situacao', function(req, res) {
    let sql = 'SELECT * FROM produtos';

    conexao.query(sql, function(erro, retorno) {
        res.render('formulario', {produtos: retorno, situacao:req.params.situacao});
    })
});

// Rota de cadastro de produtos
app.post('/cadastrar', function(req, res) {
  try {
    let nome = req.body.nome;
    let valor = req.body.valor;
    let imagem = req.files.imagem.name;

    // Validando nome do produto e valor
    if(nome === '' || valor === '' || isNaN(valor) ){
        res.redirect('/falhaCadastro');
    } else {
         // Comando sql para o DB
        let sql = `INSERT INTO produtos (nome, valor, imagem) VALUES('${nome}',${valor}, '${imagem}')`;
 
    // Executando o comando sql
        conexao.query(sql, function(erro, retorno) {
 
     // Caso der um erro, mostrar o erro
            if(erro) throw erro;
 
     // Objetivo
            req.files.imagem.mv(__dirname+'/imagens/'+req.files.name);
             console.log(retorno);
         });
 
        res.redirect('/okCadastro');
    }
 
   
  } catch(erro) {
    res.redirect('/falhaCadastro');
  }
});

// Rota para remover aprodutos
app.get('/remover/:codigo&:imagem', function(req, res){
    
    // Tratamento de exeção
    try {
            // Comando sql
        let sql = `DELETE FROM produtos WHERE codigo = ${req.params.codigo}`;

        // Executando o comando
        conexao.query(sql, function(erro, retorno) {

            // Caso der um erro, mostrar o erro
            if(erro) throw erro;


            // Caso der certo, fazer a remoção do produto
            fs.unlink(__dirname+'/imagens/'+req.params.imagem,(erro_imagem)=>{
                console.log('Falha ao remover imagem');
            });
        });

        res.redirect('/okRemover');
    } catch(erro) {
        res.redirect('/falhaRemover');
    }
   
});


// Rota para editar o formulário
app.get('/formularioEditar/:codigo', function(req, res) {

    // Comando sql
    let sql = `SELECT * FROM produtos WHERE codigo = ${req.params.codigo}`;

    // Executando o comando
    conexao.query(sql, function(erro, retorno) {

        // Caso der um erro, mostrar o erro
        if(erro) throw erro;

        // Caso der certo, fazer a edição
        res.render('formularioEditar',{produto:retorno[0]});
    })    
});

// Rota para editar o produto
app.post('/editar', function(req, res) {

    // Obter os dados do formulário
    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let nomeImagem = req.body.nomeImagem;
    
    // Validar nome do produto e valor
    if(nome === '' || valor === '' || isNaN(valor) ){
        res.redirect('/falhaEdicao');
    } else {
        // Definir o tipo de edição
        try{
            // Objeto de imagem
             let imagem = req.files.imagem;
        
        // Comando sql
             let sql = `UPDATE produtos SET nome="${nome}", valor=${valor}, imagem="${imagem.name}" WHERE codigo=${codigo}`;

        // Executando o comando
            conexao.query(sql, function(erro, retorno) {

            // if de erro
                if(erro) throw erro;

            // Objetivo
                // Removendo imagem antiga
                     fs.unlink(__dirname+'/imagens/'+nomeImagem, (erro_imagem) => {
                    console.log('Falha ao remover a imagem');
                });

                // Cadastrando nova imagem
                imagem.mv(__dirname+'/imagens/'+imagem.name);

        });
        } catch(erro) {
            // slq
            let sql = `UPDATE produtos SET nome="${nome}", valor=${valor} WHERE codigo=${codigo}`;

            // Executar sql
            conexao.query(sql, function(erro, retorno) {
                if(erro) throw erro;
            })
        };
        
        res.redirect('/okEdicao');
    }

    
});

app.listen(8080); 