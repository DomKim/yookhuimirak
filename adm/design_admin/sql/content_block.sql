CREATE TABLE IF NOT EXISTS `content_block` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `block_no` int(11) NOT NULL DEFAULT '',
  `block_name` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;
