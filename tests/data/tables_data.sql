INSERT INTO users (username, password, email) VALUES ('user1','pass1','email1');
INSERT INTO users (username, password, email) VALUES ('user2','pass2','email2');
INSERT INTO users (username, password, email) VALUES ('user3','pass3','email3');

INSERT INTO profiles (first_name, last_name, user_id) VALUES ('first 1','last 1',1);
INSERT INTO profiles (first_name, last_name, user_id) VALUES ('first 2','last 2',2);

INSERT INTO posts (title, create_time, author_id) VALUES ('post 1','2000-01-01',1);
INSERT INTO posts (title, create_time, author_id) VALUES ('post 2','2000-01-02',2);
INSERT INTO posts (title, create_time, author_id) VALUES ('post 3','2000-01-03',2);
INSERT INTO posts (title, create_time, author_id) VALUES ('post 4','2000-01-04',2);
INSERT INTO posts (title, create_time, author_id) VALUES ('post 5','2000-01-05',3);

INSERT INTO comments (content, post_id, author_id) VALUES ('comment 1',1, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 2',1, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 3',1, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 4',2, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 5',2, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 6',3, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 7',3, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 8',3, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 9',3, 2);
INSERT INTO comments (content, post_id, author_id) VALUES ('comment 10',5, 3);

INSERT INTO categories (name, parent_id) VALUES ('cat 1',NULL);
INSERT INTO categories (name, parent_id) VALUES ('cat 2',NULL);
INSERT INTO categories (name, parent_id) VALUES ('cat 3',NULL);
INSERT INTO categories (name, parent_id) VALUES ('cat 4',1);
INSERT INTO categories (name, parent_id) VALUES ('cat 5',1);
INSERT INTO categories (name, parent_id) VALUES ('cat 6',5);
INSERT INTO categories (name, parent_id) VALUES ('cat 7',5);

INSERT INTO post_category (category_id, post_id) VALUES (1,1);
INSERT INTO post_category (category_id, post_id) VALUES (2,1);
INSERT INTO post_category (category_id, post_id) VALUES (3,1);
INSERT INTO post_category (category_id, post_id) VALUES (4,2);
INSERT INTO post_category (category_id, post_id) VALUES (1,2);
INSERT INTO post_category (category_id, post_id) VALUES (1,3);

INSERT INTO orders (key1,key2,name) VALUES (1,2,'order 12');
INSERT INTO orders (key1,key2,name) VALUES (1,3,'order 13');
INSERT INTO orders (key1,key2,name) VALUES (2,1,'order 21');
INSERT INTO orders (key1,key2,name) VALUES (2,2,'order 22');

INSERT INTO items (name,col1,col2) VALUES ('item 1',1,2);
INSERT INTO items (name,col1,col2) VALUES ('item 2',1,2);
INSERT INTO items (name,col1,col2) VALUES ('item 3',1,3);
INSERT INTO items (name,col1,col2) VALUES ('item 4',2,2);
INSERT INTO items (name,col1,col2) VALUES ('item 5',2,2);