// Import des modules nécessaires
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Chemin d'accès au fichier JSON contenant les tâches
const tasksFilePath = path.join(__dirname, 'tasks.json');

// Fonction pour charger les tâches depuis le fichier JSON
function loadTasks() {
  try {
    const dataBuffer = fs.readFileSync(tasksFilePath);
    return JSON.parse(dataBuffer.toString());
  } catch (error) {
    console.error('Erreur de lecture du fichier : ', error);
    return [];
  }
}

// Fonction pour sauvegarder les tâches dans le fichier JSON
function saveTasks(tasks) {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
}

// Fonction pour générer un identifiant unique pour une nouvelle tâche
function generateId(tasks) {
  const ids = tasks.map(task => Number(task.id));
  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
  return String(maxId + 1);
}

// Création du serveur HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // Route pour afficher toutes les tâches : GET /tasks
  if(req.method === 'GET' && pathname === '/tasks') {
    const tasks = loadTasks();
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(tasks));
    return;
  }

  // Route pour ajouter une tâche : POST /tasks
  if(req.method === 'POST' && pathname === '/tasks') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const newTaskData = JSON.parse(body);
        if(!newTaskData.task) {
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ error: "La clé 'task' est obligatoire" }));
          return;
        }
        const tasks = loadTasks();
        const newTask = {
          id: generateId(tasks),
          task: newTaskData.task,
          done: false
        };
        tasks.push(newTask);
        saveTasks(tasks);
        res.writeHead(201, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(newTask));
      } catch (error) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: "Données JSON invalides" }));
      }
    });
    return;
  }

  // Route pour supprimer une tâche : DELETE /tasks?id=XXX
  if(req.method === 'DELETE' && pathname === '/tasks') {
    const { id } = query;
    if(!id) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ error: 'L\'identifiant (id) est requis' }));
      return;
    }
    const tasks = loadTasks();
    const taskIndex = tasks.findIndex(task => task.id === id);
    if(taskIndex === -1) {
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ error: 'Tâche non trouvée' }));
      return;
    }
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    saveTasks(tasks);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(deletedTask));
    return;
  }

  // Route par défaut pour une URL non définie (404)
  res.writeHead(404, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({ error: "Route non trouvée" }));
});

// Démarrage du serveur sur le port 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
