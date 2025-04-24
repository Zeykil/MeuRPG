import sqlite3
import json # Necessário para lidar com os campos JSON dos monstros
import os # Necessário para verificar o caminho do arquivo
from flask import Flask, request, jsonify, g
from flask_cors import CORS # Importa a extensão CORS
from click import command # Importa command para comandos CLI

app = Flask(__name__)
CORS(app) # Habilita CORS para todas as rotas

DATABASE = 'database.db' # Define o nome do arquivo do banco de dados

# Função para obter a conexão com o banco de dados
def get_db():
    # Verifica se a conexão já existe no contexto da aplicação
    db = getattr(g, '_database', None)
    if db is None:
        # Se não existir, cria uma nova conexão
        db = g._database = sqlite3.connect(DATABASE)
        # Configura a row_factory para permitir acessar colunas pelo nome
        db.row_factory = sqlite3.Row
    return db

# Função para fechar a conexão com o banco de dados ao final do contexto da aplicação
@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Função para inicializar o banco de dados
def init_db():
    with app.app_context():
        db = get_db()
        try:
            # Abre o arquivo schema.sql e executa seu conteúdo
            # Usa encoding='utf-8' para garantir que caracteres especiais sejam lidos corretamente
            with app.open_resource('schema.sql', mode='r', encoding='utf-8') as f:
                db.cursor().executescript(f.read())
            db.commit() # Confirma as mudanças no banco de dados
            print("Banco de dados 'database.db' inicializado com sucesso.")
        except FileNotFoundError:
            print("Erro: O arquivo 'schema.sql' não foi encontrado na pasta do aplicativo Flask.")
        except Exception as e:
            print(f"Erro ao inicializar o banco de dados: {e}")


# Comando CLI para inicializar o banco de dados
@command('init-db') # Define o comando 'init-db' para a CLI
def init_db_command():
    """Cria as tabelas do banco de dados a partir do schema.sql."""
    init_db() # Chama a função de inicialização do banco
    print('Banco de dados inicializado via comando CLI.')

# Adiciona o comando init-db ao aplicativo Flask CLI
app.cli.add_command(init_db_command)


# --- Rotas da API ---

# Rota para listar todos os personagens
@app.route('/api/personagens', methods=['GET'])
def get_all_personagens():
    """
    Retorna uma lista com todos os personagens salvos (apenas ID por enquanto).
    Endpoint: GET /api/personagens
    """
    db = get_db()
    # Seleciona todos os IDs da tabela personagens
    # Se você adicionar uma coluna 'name' na tabela personagens, pode selecionar ela aqui também:
    # personagens = db.execute('SELECT id, name FROM personagens').fetchall()
    personagens = db.execute('SELECT id FROM personagens').fetchall()

    # Converte as linhas do banco para uma lista de dicionários
    personagens_list = [dict(p) for p in personagens]

    # --- Adicionado para debug ---
    print("Lista de personagens retornada pelo backend:", personagens_list)
    # -----------------------------

    return jsonify(personagens_list)


# Rotas para gerenciar um personagem individual pelo ID
@app.route('/api/personagem/<string:character_id>', methods=['GET'])
def get_character(character_id):
    """
    Retorna os dados de um personagem específico pelo ID.
    Endpoint: GET /api/personagem/<character_id>
    """
    db = get_db()
    character = db.execute('SELECT * FROM personagens WHERE id = ?', (character_id,)).fetchone()

    if character is None:
        # Retorna 404 se o personagem não for encontrado
        return jsonify({"message": "Personagem não encontrado"}), 404
    else:
        # Converte a linha do banco para um dicionário e retorna como JSON
        return jsonify(dict(character))

@app.route('/api/personagem/<string:character_id>', methods=['PUT'])
def update_character(character_id):
    """
    Atualiza os dados de um personagem específico pelo ID.
    Endpoint: PUT /api/personagem/<character_id>
    Espera um corpo JSON com os dados atualizados do personagem.
    Se o ID não existir, insere um novo personagem.
    """
    db = get_db()
    # Verifica se a requisição tem um corpo JSON
    if not request.json:
        return jsonify({"message": "Corpo da requisição deve ser JSON"}), 400

    data = request.json # Obtém os dados do JSON da requisição

    # Validação básica dos dados recebidos (campos que esperam inteiros)
    # Adapte esta lista conforme as colunas inteiras na sua tabela 'personagens'
    required_int_fields = ['hp_atual', 'mana_estamina_atual', 'level', 'pontos_disponiveis',
                           'for_attr', 'agi_attr', 'vel_attr', 'int_attr', 'res_attr', 'esp_attr', 'car_attr']

    for field in required_int_fields:
        value = data.get(field)
        # Verifica se o campo existe e é um número inteiro
        if value is None or not isinstance(value, int):
             # Tenta converter string para int se necessário (inputs HTML enviam strings)
             if isinstance(value, str):
                 try:
                     data[field] = int(value)
                 except (ValueError, TypeError):
                     return jsonify({"message": f"Campo '{field}' inválido (não é um número inteiro)"}), 400
             else:
                 # Retorna um erro 400 se o campo estiver ausente ou não for um número válido
                 return jsonify({"message": f"Campo '{field}' ausente ou inválido (esperado número inteiro)"}), 400


    # Tenta encontrar o personagem existente pelo ID
    existing_character = db.execute('SELECT id FROM personagens WHERE id = ?', (character_id,)).fetchone()

    if existing_character is None:
        # Se o personagem não existir, insere um novo registro
        try:
            db.execute("""
                INSERT INTO personagens (id, hp_atual, mana_estamina_atual, level, pontos_disponiveis,
                                        for_attr, agi_attr, vel_attr, int_attr, res_attr, esp_attr, car_attr)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                character_id, data['hp_atual'], data['mana_estamina_atual'], data['level'], data['pontos_disponiveis'],
                data['for_attr'], data['agi_attr'], data['vel_attr'], data['int_attr'], data['res_attr'], data['esp_attr'], data['car_attr']
            ))
            db.commit() # Salva as mudanças no banco de dados

            # Retorna uma resposta com status 201 Created para indicar que um novo recurso foi criado
            return jsonify({"message": "Personagem criado e salvo com sucesso!", "id": character_id}), 201

        except sqlite3.IntegrityError:
            # Trata o caso onde o ID já pode existir por algum motivo inesperado
            return jsonify({"message": "Erro ao criar personagem. ID já existe ou outro problema de integridade."}), 500
        except Exception as e:
            # Trata outros erros durante a inserção
            db.rollback() # Desfaz a operação em caso de erro
            return jsonify({"message": f"Erro inesperado ao criar personagem: {str(e)}"}), 500

    else:
        # Se o personagem existir, atualiza o registro existente
        try:
            db.execute("""
                UPDATE personagens
                SET hp_atual = ?, mana_estamina_atual = ?, level = ?, pontos_disponiveis = ?,
                    for_attr = ?, agi_attr = ?, vel_attr = ?, int_attr = ?, res_attr = ?, esp_attr = ?, car_attr = ?
                WHERE id = ?
            """, (
                data['hp_atual'], data['mana_estamina_atual'], data['level'], data['pontos_disponiveis'],
                data['for_attr'], data['agi_attr'], data['vel_attr'], data['int_attr'], data['res_attr'], data['esp_attr'], data['car_attr'],
                character_id
            ))
            db.commit() # Salva as mudanças no banco de dados

            # Retorna uma resposta de sucesso
            return jsonify({"message": "Dados do personagem atualizados com sucesso!", "id": character_id})

        except Exception as e:
            # Trata erros durante a atualização
            db.rollback() # Desfaz a operação em caso de erro
            return jsonify({"message": f"Erro ao atualizar personagem: {str(e)}"}), 500


# Rotas para gerenciar um monstro individual pelo ID
@app.route('/api/monstro/<string:monster_id>', methods=['GET'])
def get_monstro(monster_id):
    """
    Retorna os dados de um monstro específico pelo ID.
    Endpoint: GET /api/monstro/<monster_id>
    """
    db = get_db()
    monstro = db.execute('SELECT * FROM monstros WHERE id = ?', (monster_id,)).fetchone()

    if monstro is None:
        # Retorna 404 se o monstro não for encontrado
        return jsonify({"message": "Monstro não encontrado"}), 404
    else:
         # Converte a linha do banco para um dicionário.
         # Note: Campos JSON (stats_json etc.) virão como strings do DB.
         # O frontend precisará fazer JSON.parse() neles.
        return jsonify(dict(monstro))

@app.route('/api/monstro/<string:monster_id>', methods=['PUT'])
def update_monstro(monster_id):
    """
    Atualiza os dados de um monstro específico pelo ID.
    Endpoint: PUT /api/monstro/<monster_id>
    Espera um corpo JSON com os dados atualizados do monstro.
    Se o ID não existir, insere um novo monstro.
    """
    db = get_db()
    if not request.json:
        return jsonify({"message": "Corpo da requisição deve ser JSON"}), 400

    data = request.json

    # Validação básica: verificar hp_atual (campo inteiro necessário)
    hp_atual = data.get('hp_atual')

    if hp_atual is None or not isinstance(hp_atual, int):
        # Tenta converter string para int se necessário
         if isinstance(hp_atual, str):
             try:
                 hp_atual = int(hp_atual)
             except (ValueError, TypeError):
                 return jsonify({"message": "Campo 'hp_atual' inválido (não é um número inteiro)"}), 400
         else:
            return jsonify({"message": "Campo 'hp_atual' ausente ou inválido (esperado número inteiro)"}), 400


    # Campos JSON opcionais (stats_json, abilities_json, description_json)
    # Estes campos são esperados como strings JSON ou None
    stats_json_data = data.get('stats_json', None)
    abilities_json_data = data.get('abilities_json', None)
    description_json_data = data.get('description_json', None)

    # Opcional: Você pode adicionar validação extra aqui para garantir que, se presentes,
    # esses campos são strings ou tentar convertê-los para strings JSON se vierem como objetos/listas.
    # Por exemplo:
    if isinstance(stats_json_data, (dict, list)):
        try:
            stats_json_data = json.dumps(stats_json_data)
        except TypeError:
            return jsonify({"message": "Campo 'stats_json' inválido (não é um objeto/lista serializável ou string)"}), 400
    if isinstance(abilities_json_data, (dict, list)):
         try:
            abilities_json_data = json.dumps(abilities_json_data)
         except TypeError:
            return jsonify({"message": "Campo 'abilities_json' inválido (não é um objeto/lista serializável ou string)"}), 400
    if isinstance(description_json_data, (dict, list)):
         try:
            description_json_data = json.dumps(description_json_data)
         except TypeError:
            return jsonify({"message": "Campo 'description_json' inválido (não é um objeto/lista serializável ou string)"}), 400


    # Tenta encontrar o monstro existente
    existing_monstro = db.execute('SELECT * FROM monstros WHERE id = ?', (monster_id,)).fetchone()

    if existing_monstro is None:
         # Se não existir, insere um novo monstro
         try:
            db.execute("""
                INSERT INTO monstros (id, hp_atual, stats_json, abilities_json, description_json)
                VALUES (?, ?, ?, ?, ?)
            """, (
                monster_id, hp_atual, stats_json_data, abilities_json_data, description_json_data
            ))
            db.commit()
            return jsonify({"message": "Monstro criado e salvo com sucesso!", "id": monster_id}), 201 # 201 Created

         except sqlite3.IntegrityError:
             return jsonify({"message": "Erro ao criar monstro. ID já existe ou outro problema de integridade."}), 500
         except Exception as e:
             db.rollback()
             return jsonify({"message": f"Erro inesperado ao criar monstro: {str(e)}"}), 500


    else:
        # Se existir, atualiza os dados do monstro
        # Pega os valores atuais para não sobrescrever com None se não forem enviados no PUT
        current_monstro = dict(existing_monstro) # Converte para dict para facilitar acesso

        # Usa os dados recebidos se existirem, caso contrário mantém os atuais do DB
        final_stats_json = stats_json_data if stats_json_data is not None else current_monstro.get('stats_json')
        final_abilities_json = abilities_json_data if abilities_json_data is not None else current_monstro.get('abilities_json')
        final_description_json = description_json_data if description_json_data is not None else current_monstro.get('description_json')


        try:
            db.execute("""
                UPDATE monstros
                SET hp_atual = ?, stats_json = ?, abilities_json = ?, description_json = ?
                WHERE id = ?
            """, (
                hp_atual, final_stats_json, final_abilities_json, final_description_json, monster_id
            ))
            db.commit()

            return jsonify({"message": "Dados do monstro atualizados com sucesso!", "id": monster_id})

        except Exception as e:
            db.rollback()
            return jsonify({"message": f"Erro ao atualizar monstro: {str(e)}"}), 500


# --- Adicione outras rotas da API aqui, se houver ---
# Rotas de histórico de rolagem NÃO estão incluídas nesta versão


# Bloco principal para rodar a aplicação (usar 'flask run' é o método recomendado)
if __name__ == '__main__':
    # Este bloco só é executado quando o script app.py é rodado diretamente
    # Usar 'flask run' é o método recomendado, mas este bloco fornece instruções úteis
    print("\n--- Para rodar o aplicativo Flask ---")
    print(f"1. Certifique-se que está na pasta '{os.path.basename(os.path.abspath('.'))}'")
    print("2. Certifique-se que o ambiente virtual está ativado.")
    print("3. Defina a variável de ambiente FLASK_APP:")
    print("   # No macOS/Linux:")
    print("   export FLASK_APP=app.py")
    print("   # No Windows:")
    print("   set FLASK_APP=app.py")
    print("4. Inicialize o banco de dados (SE as tabelas ainda não existirem ou schema.sql mudou):")
    print("   flask --app app init-db") # Use --app app explicitamente
    print("5. Rode o servidor:")
    print("   flask run")
    print("\nServidor rodando em http://127.0.0.1:5000/")