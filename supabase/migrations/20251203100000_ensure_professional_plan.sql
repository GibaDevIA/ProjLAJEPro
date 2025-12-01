DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Profissional') THEN
        INSERT INTO plans (name, description, price, is_active, stripe_price_id)
        VALUES ('Profissional', 'Para arquitetos e engenheiros autônomos.', 147, true, 'price_1SZYZvJMdLIyjifR7ZzexA1v');
    ELSE
        UPDATE plans 
        SET is_active = true, 
            stripe_price_id = 'price_1SZYZvJMdLIyjifR7ZzexA1v'
        WHERE name = 'Profissional';
    END IF;
END $$;
