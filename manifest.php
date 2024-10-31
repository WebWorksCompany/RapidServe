<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebWorks RapidServe Manifest</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        ul { list-style-type: none; padding-left: 20px;}
        .file-name { font-weight: bold; }
        .file-details { color: #555; }
        .folder { cursor: pointer; color: blue; text-decoration: underline; }
        .folder-content { display: none; }
        a.link{
            display: inline-block;
            vertical-align: middle;
            width: 372px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 5px 0 5px;
        }
    </style>
</head>
<body>
    <h1>WebWorks RapidServe Manifest</h1>
    <p>When using you accept our <a href="/terms.php">terms</a>.</p>

    <ul>
        <?php
        $excludeFiles = ['index.php', 'manifest.php'];
        $baseURL = 'https://' . $_SERVER['HTTP_HOST'] . str_replace($_SERVER['DOCUMENT_ROOT'], '', __DIR__);

        function formatFileSize($bytes) {
            $units = ['B', 'KB', 'MB', 'GB', 'TB'];
            $unitIndex = 0;

            while ($bytes >= 1024 && $unitIndex < count($units) - 1) {
                $bytes /= 1024;
                $unitIndex++;
            }

            return round($bytes, 2) . ' ' . $units[$unitIndex];
        }

        function getVersionHash($plaintext) {
            $cipher = "aes-256-cbc";
            $key = 'q9348thnvgdifk3y';
            $iv = str_repeat(chr(0), openssl_cipher_iv_length($cipher));
            $encrypted = openssl_encrypt($plaintext, $cipher, $key, 0, $iv);
            return base64_encode($encrypted);
        }

        function renderDirectory($dir) {
            global $excludeFiles, $baseURL;
            $output = '';

            // Get all files and folders
            $filesAndDirs = scandir($dir);
            foreach ($filesAndDirs as $name) {
                if ($name === '.' || $name === '..' || in_array($name, $excludeFiles)) {
                    continue; // Skip current and parent directory links
                }

                $fullPath = "$dir/$name";
                $relativePath = str_replace($_SERVER['DOCUMENT_ROOT'], '', $fullPath);
                $urlPath = htmlspecialchars($baseURL . '/' . ltrim($relativePath, '/'), ENT_QUOTES, 'UTF-8');

                if (is_dir($fullPath)) {
                    // If it's a directory, render it as collapsible
                    $output .= "<li>
                        <span class='folder' onclick='toggleFolder(this)'>$name ></span>
                        <ul class='folder-content'>" . renderDirectory($fullPath) . "</ul>
                    </li>";
                } else {
                    // If it's a file, display its details
                    $size = formatFileSize(filesize($fullPath));

                    // VersionID is just the file size
                    $versionID = getVersionHash(filesize($fullPath));
                    $type = strtoupper(pathinfo($name, PATHINFO_EXTENSION));
                    $output .= "<li>
                        <span class='file-name'>$name</span>
                        <span class='file-details'> | <a class=\"link\" href=\"$urlPath?v=s_$versionID\">$urlPath?v=s_$versionID</a> | Type: $type | Size: $size</span>
                    </li>";
                }
            }

            return $output;
        }

        // Start rendering from the current directory
        echo renderDirectory(__DIR__);
        ?>
    </ul>

    <script>
        function toggleFolder(element) {
            const folderContent = element.nextElementSibling;
            folderContent.style.display = (folderContent.style.display === "block") ? "none" : "block";
        }

        // Hide all folder contents by default
        document.querySelectorAll('.folder-content').forEach(function(ul) {
            ul.style.display = 'none';
        });
    </script>
</body>
</html>
