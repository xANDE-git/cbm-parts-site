-- MAIS DADOS DE EXEMPLO (só para o protótipo ficar com cara de loja). Sem preços de propósito:
-- tudo aparece como "Consulte". Fotos ilustrativas em public/exemplos/ (créditos em /creditos.html).
-- Apagar antes de cadastrar os produtos reais.

INSERT OR IGNORE INTO categorias (nome) VALUES ('Freios'), ('Suspensão'), ('Ignição'), ('Correias'), ('Embreagem');

-- Fotos para as 4 peças que já existem
UPDATE pecas SET imagem = 'exemplo-filtro-oleo.jpg' WHERE codigo = 'EX-0001';
UPDATE pecas SET imagem = 'exemplo-filtro-ar.jpg' WHERE codigo = 'EX-0002';
UPDATE pecas SET imagem = 'exemplo-filtro-combustivel.jpg' WHERE codigo = 'EX-0003';
UPDATE pecas SET imagem = 'exemplo-filtro-cabine.jpg' WHERE codigo = 'EX-0004';

INSERT OR IGNORE INTO pecas (codigo, nome, descricao, preco_centavos, estoque, categoria_id, marca_id, imagem, destaque) VALUES
 ('EX-0005', 'Disco de freio ventilado (exemplo)', 'Item de exemplo, só para ilustrar o catálogo.', NULL, 12, (SELECT id FROM categorias WHERE nome='Freios'), (SELECT id FROM marcas WHERE nome='Marca Exemplo B'), 'exemplo-disco-freio.jpg', 1),
 ('EX-0006', 'Amortecedor dianteiro (exemplo)', 'Item de exemplo, só para ilustrar o catálogo.', NULL, 4, (SELECT id FROM categorias WHERE nome='Suspensão'), (SELECT id FROM marcas WHERE nome='Marca Exemplo A'), 'exemplo-amortecedor.jpg', 0),
 ('EX-0007', 'Vela de ignição (exemplo)', 'Item de exemplo, só para ilustrar o catálogo.', NULL, 40, (SELECT id FROM categorias WHERE nome='Ignição'), (SELECT id FROM marcas WHERE nome='Marca Exemplo A'), 'exemplo-vela.jpg', 0),
 ('EX-0008', 'Correia dentada (exemplo)', 'Item de exemplo, só para ilustrar o catálogo.', NULL, 0, (SELECT id FROM categorias WHERE nome='Correias'), (SELECT id FROM marcas WHERE nome='Marca Exemplo B'), 'exemplo-correia-dentada.jpg', 0),
 ('EX-0009', 'Kit de embreagem (exemplo)', 'Item de exemplo, só para ilustrar o catálogo.', NULL, 7, (SELECT id FROM categorias WHERE nome='Embreagem'), (SELECT id FROM marcas WHERE nome='Marca Exemplo B'), 'exemplo-kit-embreagem.jpg', 0);

-- Carros de exemplo (inventados) para a busca por veículo funcionar na demonstração
INSERT INTO aplicacoes (peca_id, montadora, modelo, ano_inicial, ano_final, motor)
SELECT id, 'Volkswagen', 'Gol', 2009, 2018, '1.6' FROM pecas
WHERE codigo IN ('EX-0005','EX-0006','EX-0007','EX-0008','EX-0009')
  AND NOT EXISTS (SELECT 1 FROM aplicacoes a WHERE a.peca_id = pecas.id);
UPDATE pecas SET destaque = 1 WHERE codigo = 'EX-0007';
