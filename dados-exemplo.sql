-- DADOS DE EXEMPLO, só para testar o visual. NÃO são produtos reais da CBM Parts
-- e NÃO devem ir para o site no ar. Preços e carros são inventados para teste.

INSERT OR IGNORE INTO categorias (nome) VALUES ('Filtros de óleo'), ('Filtros de ar'), ('Filtros de combustível'), ('Filtros de cabine');
INSERT OR IGNORE INTO marcas (nome) VALUES ('Marca Exemplo A'), ('Marca Exemplo B');

INSERT OR IGNORE INTO pecas (codigo, nome, descricao, preco_centavos, estoque, categoria_id, marca_id, destaque) VALUES
 ('EX-0001', 'Filtro de óleo (exemplo)', 'Item de teste.', 2490, 35, (SELECT id FROM categorias WHERE nome='Filtros de óleo'), (SELECT id FROM marcas WHERE nome='Marca Exemplo A'), 1),
 ('EX-0002', 'Filtro de ar do motor (exemplo)', 'Item de teste.', 4590, 12, (SELECT id FROM categorias WHERE nome='Filtros de ar'), (SELECT id FROM marcas WHERE nome='Marca Exemplo A'), 1),
 ('EX-0003', 'Filtro de combustível (exemplo)', 'Item de teste.', 3290, 0, (SELECT id FROM categorias WHERE nome='Filtros de combustível'), (SELECT id FROM marcas WHERE nome='Marca Exemplo B'), 0),
 ('EX-0004', 'Filtro de cabine (exemplo)', 'Item de teste. Sem preço: aparece como "Consulte".', NULL, 8, (SELECT id FROM categorias WHERE nome='Filtros de cabine'), (SELECT id FROM marcas WHERE nome='Marca Exemplo B'), 0);

INSERT INTO aplicacoes (peca_id, montadora, modelo, ano_inicial, ano_final, motor)
SELECT id, 'Fiat', 'Uno', 2010, 2016, '1.0' FROM pecas WHERE codigo='EX-0001' AND NOT EXISTS (SELECT 1 FROM aplicacoes a WHERE a.peca_id = pecas.id);
INSERT INTO aplicacoes (peca_id, montadora, modelo, ano_inicial, ano_final, motor)
SELECT id, 'Volkswagen', 'Gol', 2009, 2018, '1.6' FROM pecas WHERE codigo='EX-0002' AND NOT EXISTS (SELECT 1 FROM aplicacoes a WHERE a.peca_id = pecas.id);
