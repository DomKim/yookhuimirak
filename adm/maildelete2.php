<?php
require_once './_common.php';
require_once G5_LIB_PATH . '/mailer.lib.php';

    if ($_POST['wr_id'] !='') {
        $wr_id = $_POST['wr_id'];


        $sql = " delete from g5_email_data2 where id='".$wr_id."'";
        echo $sql;
        sql_query($sql);
        
    }