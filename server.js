"use strict";

const { Client } = require('pg');
const express = require('express');
// const multer = require('multer'); 
// const AWS = require('aws-sdk'); 
// const fs = require('fs');

const app = express();
app.use(express.static("public"));
const PORT = 8000;

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.listen(PORT, () => {
    console.log('Server listening on port' + PORT);
});

const clientConfig = {
    user: 'postgres',
    password: 'mypacepokedexpostgresql',
    host: 'pokedex-rds.cfqagimcm2pp.us-east-2.rds.amazonaws.com',
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
    }
};

const client = new Client(clientConfig);
client.connect().then(() => {
	console.log("Connected to the database");
}).catch(err => {
	console.error("Database connection error", err);
});

const updateDatabase = async (query, values, res) => {
	try {
		await client.query(query, values);
		res.status(200).send({ message: 'Success' });
	} catch (error) {
		console.error(error);
		res.status(300).send({ error: 'Invalid input' });
	}
};

// List of all pokemons with all details
app.get('/pokemon', async function (req, res) {
    try {
        const client = new Client(clientConfig);
        await client.connect();
        const query = `
            SELECT DISTINCT
                p.id, 
                p.name, 
                array_agg(DISTINCT m.name) AS moves, 
                array_agg(DISTINCT t.name) AS type, 
                pb.hp, 
                pb.attack, 
                pb.defense, 
                pb.special_attack, 
                pb.special_defense, 
                pb.speed 
            FROM (pokemon p 
            JOIN pokemon_moves pm ON p.id = pm.pokemon_id 
            JOIN moves m ON pm.move_id = m.id 
            JOIN pokemon_types pt ON p.id = pt.pokemon_id 
            JOIN types t ON t.id = pt.type_Id 
            JOIN pokemon_base_stats pb ON p.id = pb.pokemon_id) GROUP BY p.id, pb.hp, 
                pb.attack, 
                pb.defense, 
                pb.special_attack, 
                pb.special_defense, 
                pb.speed;
        `;
        const result = await client.query(query);

        res.set("Content-Type", "application/json");
        res.send(result.rows);
    } catch (ex) {
        res.status(500).send("Internal Error - No Pokemon Found");
    }
});

// List of all details of that specific pokemon ID
app.get('/pokemon/:id', async function (req, res) {
    try {
        const { id } = req.params;

        const client = new Client(clientConfig);
        await client.connect();

        const query = `
            SELECT 
                p.id, 
                p.name, 
                array_agg(DISTINCT m.name) AS moves, 
                array_agg(DISTINCT t.name) AS type,  
                pb.hp, 
                pb.attack, 
                pb.defense, 
                pb.special_attack, 
                pb.special_defense, 
                pb.speed 
            FROM (pokemon p 
            JOIN pokemon_moves pm ON p.id = pm.pokemon_id 
            JOIN moves m ON pm.move_id = m.id 
            JOIN pokemon_types pt ON p.id = pt.pokemon_id 
            JOIN types t ON t.id = pt.type_Id 
            JOIN pokemon_base_stats pb ON p.id = pb.pokemon_id) 
            WHERE p.id = $1 GROUP BY p.id, 
                p.name, 
                pb.hp, 
                pb.attack, 
                pb.defense, 
                pb.special_attack, 
                pb.special_defense, 
                pb.speed; 
        `;
        const result = await client.query(query, [id]);
        res.json(result.rows);
    } catch (e) {
        res.status(500).send("Internal Server Error");
    }
});
// List of all the species and the species ID
app.get('/species', async function (req, res) {
    try {
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("SELECT id,name FROM species");
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// List of all details of that specific species ID
app.get('/species/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("SELECT name,id FROM species WHERE id = $1", [id]);
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    }
    catch (e) {
        res.status(500).send(e.message);
    }
});

// List of all moves in pokemon
app.get('/moves', async function (req, res) {
    try {
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("SELECT id,name FROM moves");
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    }
    catch (e) {
        res.status(500).send(e.message);
    }
});
// List of all details of that specific move ID
app.get('/moves/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("SELECT id,name FROM moves WHERE id = $1", [id]);
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    }
    catch (e) {
        res.status(500).send(e.message);
    }
});

//List of all pokemon name, ID, and image(maybe) of that specific TYPE
app.get('/pokemon/types/:type', async function (req, res) {
    try {
        const { type } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query(`
            SELECT t.name, p.name
            FROM pokemon p
            JOIN pokemon_types pt ON pt.pokemon_id = p.id
            JOIN types t ON t.id = pt.type_Id
            WHERE t.name = $1
        `, [type]);
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// List of all types in pokemon
app.get('/types', async function (req, res) {
    try {
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("SELECT id,name FROM TYPES");
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    }
    catch (e) {
        res.status(500).send(e.message);
    }
});
// List of all details of that specific type ID
app.get('/types/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query(`
            SELECT t.name, te.attacking_type_id, te.defending_type_id, te.effectiveness
            FROM types t
            JOIN type_effectiveness te
                ON t.id = te.attacking_type_id
                OR t.id = te.defending_type_id
            WHERE t.id = $1
        `, [id]);
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    } catch (e) {
        res.status(500).send(e.message);
    }
});
// List of all natures in pokemon
app.get('/natures', async function (req, res) {
    try {
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("SELECT name FROM natures");
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    }
    catch (e) {
        res.status(500).send(e.message);
    }
});

// List of all details of that specific nature ID
app.get('/natures/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("SELECT id,name,increased_stat,decreased_stat,description FROM natures WHERE id = $1", [id]);
        res.set("Content-Type", "application/json");
        res.send(result.rows);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.post("/pokemon", async (req, res) => {
    try {
        const pokemon = JSON.parse(req.body["details"])["pokemons"][0];
        const stats = pokemon["stats"];
        const moves = pokemon["moves"];
        const types = pokemon["type"];
        const client = new Client(clientConfig);
        await client.connect();
        const pokemon_query = await client.query("INSERT INTO POKEMON(name,height,weight,species_id) VALUES ($1::text,$2::integer,$3::integer,$4::integer) RETURNING *;", [pokemon['pokemon_name'], parseInt(pokemon['height']), parseInt(pokemon['weight']), parseInt(pokemon['species_id'])]);
        let pokemon_row = pokemon_query["rows"][0];
        const pokemon_base_stats_query = await client.query("INSERT INTO POKEMON_BASE_STATS(pokemon_id,hp,attack,defense,special_attack,special_defense,speed) VALUES ($1::smallint,$2::smallint,$3::smallint,$4::smallint,$5::smallint,$6::smallint,$7::smallint);", [pokemon_row["id"], stats['hp'], stats['attack'], stats['defense'], stats['special_attack'], stats['special_defense'], stats['speed']]);
        await moves.forEach(async (id) => {
            let pokemon_moves_query = await client.query("INSERT INTO POKEMON_MOVES(pokemon_id,move_id) VALUES ($1::integer,$2::integer);", [parseInt(pokemon_row["id"]), parseInt(id)]);
        });
        types.forEach(async (id) => {
            let pokemon_types_query = await client.query("INSERT INTO POKEMON_TYPES(pokemon_id,type_id) VALUES ($1::integer,$2::integer)", [pokemon_row["id"], id]);
        });

        res.set("Content-Type", "application/json");
        res.send("Pokemon added successfully!");
    } catch (ex) {
        console.log(ex);
        res.status(500).send("ERROR - INTERNAL SERVER ERROR");
    }
});

app.post("/pokemon/species", async (req, res) => {
    try {
        const species = JSON.parse(req.query['details']);
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("INSERT INTO SPECIES(name) VALUES ($1::text);", [species['species_name']]);
        res.set("Content-Type", "application/json");
        res.send("Specie added successfully!");
    } catch (ex) {
        console.log(ex);
        res.status(500).send("ERROR - INTERNAL SERVER ERROR");
    }
});

app.post("/pokemon/moves", async (req, res) => {
    try {
        const moves = JSON.parse(req.query['details']);
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("INSERT INTO MOVES(name,types_id,power,accuracy,power_point) VALUES ($1::text,$2::integer,$3::integer,$4::integer,$5::smallint);", [moves['move_name'], moves['type_id'], moves['power'], moves['accuracy'], moves['pp']]);
        res.set("Content-Type", "application/json");
        res.send("Move added successfully!");
    } catch (ex) {
        console.log(ex);
        res.status(500).send("ERROR - INTERNAL SERVER ERROR");
    }
});

app.post("/types", async (req, res) => {
    try {
        const type = JSON.parse(req.query['details']);
        const client = new Client(clientConfig);
        await client.connect();
        const types_query = await client.query("INSERT INTO TYPES(name) VALUES ($1::text) RETURNING *;", [type['type_name']]);
        const type_id = (types_query["rows"][0])["id"];

        const type_strengths = type["strengths"];

        type_strengths.forEach((id)=>{
            const type_strength_query = client.query("INSERT INTO TYPE_EFFECTIVENESS(attacking_type_id, defending_type_id, effectiveness) VALUES($1::integer, $2::integer, 0.3);",[type_id,id]);
        });

        const type_weaknesses = type["weaknesses"];

        type_weaknesses.forEach((id)=>{
            const type_strength_query = client.query("INSERT INTO TYPE_EFFECTIVENESS(attacking_type_id, defending_type_id, effectiveness) VALUES($1::integer, $2::integer, 0.2);",[id,type_id]);
        });
        //REQUEST TYPE_ID:effecTIveneSS IN OBJECT FORMAT

        res.set("Content-Type", "application/json");
        res.send("Type added successfully!");
    } catch (ex) {
        console.log(ex);
        res.status(500).send("ERROR - INTERNAL SERVER ERROR");
    }
});

app.post("/nature", async (req, res) => {
    try {
        const species = JSON.parse(req.query['details']);
        const client = new Client(clientConfig);
        await client.connect();
        const result = await client.query("INSERT INTO NATURES(name, increased_stat, decreased_stat) VALUES ($1::text,$2::text,$3::text);", [species['name'], species['increased_stat'], species['decreased_stat']]);
        res.set("Content-Type", "application/json");
        res.send("Nature added successfully!");
    } catch (ex) {
        console.log(ex);
        res.status(500).send("ERROR - INTERNAL SERVER ERROR");
    }
});

app.put('/pokemon', async (req, res) => {
	const { id, name, species_id, moves, type, height, weight, stats } = req.body;
	if (!id) return res.status(300).send({ error: 'ID is required' });

	const query = `
    UPDATE pokemon 
    SET 
      name = $2,
      species_id = $3,
      height = $4,
      weight = $5
    WHERE id = $1;
  `;

	try {
		const roundedHeight = height ? Math.round(height) : null;
		const roundedWeight = weight ? Math.round(weight) : null;

		await client.query(query, [id, name, species_id, roundedHeight, roundedWeight]);


		if (moves) {
			await client.query(`DELETE FROM pokemon_moves WHERE pokemon_id = $1;`, [id]);
			await client.query(`INSERT INTO pokemon_moves (pokemon_id, move_id) SELECT $1, UNNEST($2::int[]);`, [id, moves]);
		}

		if (type) {
			await client.query(`DELETE FROM pokemon_types WHERE pokemon_id = $1;`, [id]);
			await client.query(`INSERT INTO pokemon_types (pokemon_id, type_id) SELECT $1, UNNEST($2::int[]);`, [id, type]);
		}

		if (stats) {
			const { hp, attack, defense, special_attack, special_defense, speed } = stats;
			await client.query(`DELETE FROM pokemon_base_stats WHERE pokemon_id = $1;`, [id]);
			await client.query(`
        INSERT INTO pokemon_base_stats (pokemon_id, hp, attack, defense, special_attack, special_defense, speed)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [id, hp, attack, defense, special_attack, special_defense, speed]);
		}

		res.status(200).send({ message: 'Success' });
	} catch (error) {
		console.error(error);
		res.status(300).send({ error: 'Failed to update Pokémon' });
	}
});

app.put('/species', async (req, res) => {
	const { id, name } = req.body;
	if (!id) return res.status(300).send({ error: 'ID is required' });

	const query = `
    UPDATE species 
    SET 
      name = $2
    WHERE id = $1;
  `;

	await updateDatabase(query, [id, name], res);
});

app.put('/moves', async (req, res) => {
	const { id, name, types_id, power, accuracy, power_point } = req.body;
	if (!id) return res.status(300).send({ error: 'ID is required' });

	const query = `
    UPDATE moves 
    SET 
      name = $2,
			types_id = $3,
      power = $4,
      accuracy = $5,
      power_point = $6
    WHERE id = $1;
  `;

	await updateDatabase(query, [id, name, types_id, power, accuracy, power_point], res);
});

app.put('/types', async (req, res) => {
	const { id, name, effectiveness } = req.body;
	if (!id) return res.status(300).send({ error: 'ID is required' });

	const query = `
    UPDATE types 
    SET 
      name = $2
    WHERE id = $1;
  `;
	//TODO: update types effectiveness
	await updateDatabase(query, [id, name], res);
});

app.put('/nature', async (req, res) => {
	const { id, name, increased_stat, decreased_stat, description } = req.body;
	if (!id) return res.status(300).send({ error: 'ID is required' });

	const query = `
    UPDATE natures
    SET
			name = $2,
      increased_stat = $3,
      decreased_stat = $4,
      description = $5
    WHERE id = $1;
  `;

	await updateDatabase(query, [id, name, increased_stat, decreased_stat, description], res);
});


// Delete a specific species by ID
app.delete('/species/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        await client.query("DELETE FROM species WHERE id = $1", [id]);

        res.status(200).send(`Deleted successfully`);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Delete a specific nature by ID
app.delete('/natures/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        await client.query("DELETE FROM natures WHERE id = $1", [id]);

        res.status(200).send(`Deleted successfully`);
    } catch (e) {
        res.status(500).send(e.message);
    }
});
// Delete a specific type by ID
app.delete('/types/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        await client.query("DELETE FROM types WHERE id = $1", [id]);

        res.status(200).send(`Deleted successfully`);
    } catch (e) {
        res.status(500).send(e.message);
    }
});
// Delete a specific move by ID
app.delete('/moves/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        await client.query("DELETE FROM moves WHERE id = $1", [id]);

        res.status(200).send(`Deleted successfully`);
    } catch (e) {
        res.status(500).send(e.message);
    }
});
// Delete a specific pokemon by ID
app.delete('/pokemon/:id', async function (req, res) {
    try {
        const { id } = req.params;
        const client = new Client(clientConfig);
        await client.connect();
        await client.query("DELETE FROM pokemon_types WHERE pokemon_id=$1", [id])
        await client.query("DELETE FROM pokemon_moves WHERE pokemon_id=$1", [id])
        await client.query("DELETE FROM pokemon_base_stats WHERE pokemon_id=$1", [id])
        await client.query("DELETE FROM pokemon WHERE id = $1", [id]);

        res.status(200).send(`Deleted successfully`);
    } catch (e) {
        res.status(500).send(e.message);
    }
});