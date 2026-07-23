-- Telefone com DDI no cadastro (E.164). Opcional na coluna: contas antigas
-- nao tem; o cadastro novo exige na validacao da API.
ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(30) NULL;
