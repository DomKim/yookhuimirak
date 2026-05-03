
<?

$wr_11_chk = sql_fetch("SHOW COLUMNS FROM `$write_table`  WHERE `Field` = 'wr_11'");
if($wr_11_chk['Field'] == "")   sql_query("ALTER TABLE `$write_table` ADD `wr_11` VARCHAR( 255 ) NOT NULL AFTER `wr_10` ");

$wr_12_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_12'");
if($wr_12_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_12` VARCHAR( 255 ) NOT NULL AFTER `wr_11` ");

$wr_13_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_13'");
if($wr_13_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_13` VARCHAR( 255 ) NOT NULL AFTER `wr_12` ");

$wr_14_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_14'");
if($wr_14_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_14` VARCHAR( 255 ) NOT NULL AFTER `wr_13` ");

$wr_15_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_15'");
if($wr_15_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_15` VARCHAR( 255 ) NOT NULL AFTER `wr_14` ");

$wr_16_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_16'");
if($wr_16_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_16` VARCHAR( 255 ) NOT NULL AFTER `wr_15` ");

$wr_17_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_17'");
if($wr_17_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_17` VARCHAR( 255 ) NOT NULL AFTER `wr_16` ");

$wr_18_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_18'");
if($wr_18_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_18` VARCHAR( 255 ) NOT NULL AFTER `wr_17` ");

$wr_19_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_19'");
if($wr_19_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_19` VARCHAR( 255 ) NOT NULL AFTER `wr_18` ");

$wr_20_chk = sql_fetch("SHOW COLUMNS FROM $write_table  WHERE `Field` = 'wr_20'");
if($wr_20_chk['Field'] == "")   sql_query("ALTER TABLE $write_table ADD `wr_20` VARCHAR( 255 ) NOT NULL AFTER `wr_19` ");




$sql =" update $write_table
      set


        wr_11 = '$wr_11',
        wr_12 = '$wr_12',
        wr_13 = '$wr_13',
        wr_14 = '$wr_14',
        wr_15 = '$wr_15',
        wr_16 = '$wr_16',
        wr_17 = '$wr_17',
        wr_18 = '$wr_18',
        wr_19 = '$wr_19',
        wr_20 = '$wr_20'

      where wr_id = '$wr_id'
";

sql_query($sql);

?>
<?php
if (!defined('_GNUBOARD_')) exit; // 개별 페이지 접근 불가
?>