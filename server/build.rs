use std::{
    convert::TryFrom,
    env::var,
    fs::{remove_file, File},
    path::PathBuf,
    process::Command,
};

fn main() {
    println!("cargo:rerun-if-changed=schema.sql");
    let out_dir = var("OUT_DIR").unwrap();
    let mut out_file = PathBuf::try_from(out_dir).unwrap();
    out_file.push("schema.db");
    let out_file = out_file;
    let _ = remove_file(&out_file);
    let schema_file = File::open("schema.sql").unwrap();
    assert!(Command::new("sqlite3")
        .arg(&out_file)
        .stdin(schema_file)
        .spawn()
        .unwrap()
        .wait()
        .unwrap()
        .success());
    println!(
        "cargo:rustc-env=DATABASE_URL=sqlite://{}",
        out_file.to_string_lossy()
    );
}
