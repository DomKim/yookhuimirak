<?php
function dirZip($resource,$dir) {
     if(filetype($dir) === 'dir') {
       clearstatcache();

       if($fp = @opendir($dir)) {
         while(false !== ($ftmp = readdir($fp))){
           if(($ftmp !== ".") && ($ftmp !== "..") && ($ftmp !== ""))

           {
             if(filetype($dir.'/'.$ftmp) === 'dir') {
               clearstatcache();

               // 디렉토리이면 생성하기
               $resource->addEmptyDir($dir.'/'.$ftmp);
               set_time_limit(0);

               dirZip($resource,$dir.'/'.$ftmp);
             } else {

               // 파일이면 파일 압축하기
               $resource->addFile($dir.'/'.$ftmp);
             }
           }
                  }
           }
           if(is_resource($fp)){
                 closedir($fp);
           }
         } else {
            // 파일이면 파일 압축하기
            $resource->addFile($dir);
       }
   } // end func



   function fileCopy($odir,$ndir) {
      if(filetype($odir) === 'dir') {
           clearstatcache();

           if($fp = @opendir($odir)) {
                  while(false !== ($ftmp = readdir($fp))){
                        if(($ftmp !== ".") && ($ftmp !== "..") && ($ftmp !== "")) {
                              if(filetype($odir.'/'.$ftmp) === 'dir') {
                                   clearstatcache();

                                   @mkdir($ndir.'/'.$ftmp);
                                   //echo ($ndir.'/'.$ftmp."<br />\n");
                                   set_time_limit(0);
                                   fileCopy($odir.'/'.$ftmp,$ndir.'/'.$ftmp);
                              } else {
                                   copy($odir.'/'.$ftmp,$ndir.'/'.$ftmp);
                              }
                        }
                  }
           }
           if(is_resource($fp)){
                 closedir($fp);
           }
      } else {
            //echo $ndir."<br />\n";
            copy($odir,$ndir);
      }
 } // end func



 function rmdir_ok($dir) {
     $dirs = dir($dir);
     while(false !== ($entry = $dirs->read())) {
         if(($entry != '.') && ($entry != '..')) {
             if(is_dir($dir.'/'.$entry)) {
                   rmdir_ok($dir.'/'.$entry);
             } else {
                   @unlink($dir.'/'.$entry);
             }
         }
     }
     $dirs->close();
     @rmdir($dir);
 }




?>
