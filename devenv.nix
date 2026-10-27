{ pkgs, lib, config, inputs, ... }:

{
  packages = [
    pkgs.libpq
  ];

  languages.python = {
    enable = true;
    version = "3.14";
    venv.enable = true;
    uv = {
      enable = true;
      sync.enable = true;
    };
  };

  env = {
    PALLET_COLOURS = 16;
    NUM_SYMBOLS = 6;
    MAX_SYMBOL_AMOUNT = 10;
  };

  services = {
    postgres = {
      enable = true;
      initialDatabases = [{name = "data";}];
    };
  };

  /* processes = {
    bot.exec = "uv run collagle";
  }; */
}