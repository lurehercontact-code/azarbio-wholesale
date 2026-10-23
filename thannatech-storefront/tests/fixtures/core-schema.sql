PRAGMA foreign_keys=ON;
CREATE TABLE brands(id TEXT PRIMARY KEY,name TEXT NOT NULL,confirmer TEXT NOT NULL);
CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,salt TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','confirmer','dispatch','stock','accounting','readonly')),brand_id TEXT REFERENCES brands(id),active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),can_dispatch INTEGER NOT NULL DEFAULT 0);
CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
CREATE INDEX session_expiry ON sessions(expires);
CREATE TABLE login_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE sources(id TEXT PRIMARY KEY,brand_id TEXT NOT NULL REFERENCES brands(id),name TEXT NOT NULL,url TEXT NOT NULL,secret_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 0);
CREATE TABLE products(id TEXT PRIMARY KEY,name TEXT NOT NULL,unit TEXT NOT NULL CHECK(unit IN('g','unit')),color TEXT NOT NULL DEFAULT '',size TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE stock(sku TEXT PRIMARY KEY REFERENCES products(id),on_hand INTEGER NOT NULL DEFAULT 0 CHECK(typeof(on_hand)='integer' AND on_hand>=0),reserved INTEGER NOT NULL DEFAULT 0 CHECK(typeof(reserved)='integer' AND reserved>=0 AND reserved<=on_hand));
CREATE TABLE offers(id TEXT PRIMARY KEY,brand_id TEXT NOT NULL REFERENCES brands(id),external_code TEXT NOT NULL,sku TEXT NOT NULL REFERENCES products(id),name TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0 AND typeof(quantity)='integer'),price INTEGER NOT NULL CHECK(price>=0 AND typeof(price)='integer'),active INTEGER NOT NULL DEFAULT 1,UNIQUE(brand_id,external_code));
CREATE TABLE orders(id TEXT PRIMARY KEY,source_id TEXT REFERENCES sources(id),brand_id TEXT NOT NULL REFERENCES brands(id),external_id TEXT NOT NULL,payload_hash TEXT NOT NULL DEFAULT '',kind TEXT NOT NULL CHECK(kind IN('order','cart')),name TEXT NOT NULL,phone TEXT NOT NULL,city TEXT NOT NULL,address TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',utm TEXT NOT NULL DEFAULT '{}',confirmation TEXT NOT NULL DEFAULT 'Nouveau',delivery TEXT NOT NULL DEFAULT 'Non préparé',settlement TEXT NOT NULL DEFAULT 'Non encaissé',shipping INTEGER NOT NULL DEFAULT 0 CHECK(shipping>=0),total INTEGER NOT NULL DEFAULT 0 CHECK(total>=0),tracking TEXT UNIQUE,carrier TEXT,callback_at TEXT,assigned_to TEXT REFERENCES users(id),revision INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),updated_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),cart_revision INTEGER NOT NULL DEFAULT 0,actor TEXT NOT NULL DEFAULT 'system',operation TEXT NOT NULL DEFAULT '',UNIQUE(source_id,external_id));
CREATE INDEX orders_brand_date ON orders(brand_id,created_at DESC);
CREATE INDEX orders_phone ON orders(phone,kind);
CREATE INDEX orders_status ON orders(confirmation,delivery);
CREATE TABLE order_items(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),offer_id TEXT REFERENCES offers(id),sku TEXT NOT NULL REFERENCES products(id),name TEXT NOT NULL,unit TEXT NOT NULL CHECK(unit IN('g','unit')),quantity INTEGER NOT NULL CHECK(quantity>0 AND typeof(quantity)='integer'),price INTEGER NOT NULL CHECK(price>=0 AND typeof(price)='integer'));
CREATE INDEX order_items_order ON order_items(order_id);
CREATE TABLE reservations(order_id TEXT NOT NULL REFERENCES orders(id),sku TEXT NOT NULL REFERENCES products(id),quantity INTEGER NOT NULL CHECK(quantity>0),PRIMARY KEY(order_id,sku));
CREATE TABLE movements(id TEXT PRIMARY KEY,sku TEXT NOT NULL REFERENCES products(id),order_id TEXT REFERENCES orders(id),kind TEXT NOT NULL,delta INTEGER NOT NULL CHECK(typeof(delta)='integer'),reserved_delta INTEGER NOT NULL DEFAULT 0,reason TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE INDEX movements_sku_date ON movements(sku,created_at);
CREATE TABLE audit(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT REFERENCES orders(id),actor TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE INDEX audit_order ON audit(order_id,id);
CREATE TABLE calls(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),actor TEXT NOT NULL,started_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),duration_seconds INTEGER CHECK(duration_seconds>=0),outcome TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',duration_source TEXT CHECK(duration_source IS NULL OR duration_source='manual'));
CREATE TABLE payments(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),amount INTEGER NOT NULL CHECK(typeof(amount)='integer' AND amount!=0),kind TEXT NOT NULL CHECK(kind IN('received','refund','fee')),reference TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE INDEX payments_order ON payments(order_id);
CREATE TABLE shipments(id TEXT PRIMARY KEY,order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),state TEXT NOT NULL,tracking TEXT,request_id TEXT NOT NULL UNIQUE,error TEXT,created_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TRIGGER product_stock AFTER INSERT ON products BEGIN INSERT INTO stock(sku) VALUES(NEW.id); END;
CREATE TRIGGER stock_movement AFTER INSERT ON movements BEGIN UPDATE stock SET on_hand=on_hand+NEW.delta,reserved=reserved+NEW.reserved_delta WHERE sku=NEW.sku; END;
CREATE TRIGGER reservation_add AFTER INSERT ON reservations BEGIN
 INSERT INTO movements(id,sku,order_id,kind,delta,reserved_delta,reason,actor) VALUES(lower(hex(randomblob(16))),NEW.sku,NEW.order_id,'reserve',0,NEW.quantity,'Confirmation',(SELECT actor FROM orders WHERE id=NEW.order_id));
END;
CREATE TRIGGER reservation_remove AFTER DELETE ON reservations BEGIN
 INSERT INTO movements(id,sku,order_id,kind,delta,reserved_delta,reason,actor) VALUES(lower(hex(randomblob(16))),OLD.sku,OLD.order_id,'release',0,-OLD.quantity,'Libération',(SELECT actor FROM orders WHERE id=OLD.order_id));
END;
CREATE TRIGGER order_audit AFTER UPDATE ON orders BEGIN
 INSERT INTO audit(order_id,actor,action,detail) VALUES(NEW.id,NEW.actor,'order.update',json_object('before',json_object('confirmation',OLD.confirmation,'delivery',OLD.delivery,'settlement',OLD.settlement,'name',OLD.name,'phone',OLD.phone,'city',OLD.city,'address',OLD.address,'notes',OLD.notes,'callback_at',OLD.callback_at,'assigned_to',OLD.assigned_to),'after',json_object('confirmation',NEW.confirmation,'delivery',NEW.delivery,'settlement',NEW.settlement,'name',NEW.name,'phone',NEW.phone,'city',NEW.city,'address',NEW.address,'notes',NEW.notes,'callback_at',NEW.callback_at,'assigned_to',NEW.assigned_to)));
END;
CREATE TRIGGER confirmation_release AFTER UPDATE OF confirmation ON orders WHEN NEW.confirmation!='Confirmé' AND OLD.confirmation='Confirmé' BEGIN DELETE FROM reservations WHERE order_id=NEW.id; END;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
CREATE TRIGGER movements_no_update BEFORE UPDATE ON movements BEGIN SELECT RAISE(ABORT,'immutable_ledger'); END;
CREATE TRIGGER movements_no_delete BEFORE DELETE ON movements BEGIN SELECT RAISE(ABORT,'immutable_ledger'); END;
INSERT INTO brands VALUES('vitamor','Vitamor','Confirmeur 1'),('azarbio','AzarBio','Confirmeur 2');
INSERT INTO products(id,name,unit) VALUES('fruits-mix','Mélange de fruits lyophilisés','g');
INSERT INTO offers VALUES
('vitamor-500g','vitamor','500G','fruits-mix','500 g',500,19900,1),
('vitamor-1kg','vitamor','1KG','fruits-mix','1 kg',1000,29900,1),
('vitamor-2500g','vitamor','2KG_PLUS_500G','fruits-mix','2 kg + 500 g offerts',2500,49900,1),
('azarbio-2500g','azarbio','2.5KG','fruits-mix','2.5 kg',2500,44900,1),
('azarbio-5kg','azarbio','5KG','fruits-mix','5 kg',5000,74900,1),
('azarbio-10kg','azarbio','10KG','fruits-mix','10 kg',10000,139900,1);
