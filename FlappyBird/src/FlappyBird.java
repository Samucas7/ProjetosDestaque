import java.awt.*;
import java.awt.event.*;
import java.lang.management.GarbageCollectorMXBean;
import java.util.ArrayList.*;
import java.util.ArrayList;
import java.util.Random;
import javax.swing.*;

public class FlappyBird extends JPanel implements ActionListener, KeyListener {
    int boardWidth = 360;
    int boardHeight = 640;

    //Images
    Image backgroundImg;
    Image birdImg;
    Image topPipeImg;
    Image bottomPipeImg;
    Image paperImg;

    //Bird
    int birdX = boardWidth/8;
    int birdY = boardHeight/2;
    int birdWidth = 34;
    int birdHeight =  24;

    class Bird {
        int x = birdX;
        int y = birdY;
        int width = birdWidth;
        int height = birdHeight;
        Image img;

        Bird(Image img){
            this.img = img;
        }
    
        int velocityY = 0 ; //move bird up/down speed
    }

    //Pipes
    int pipeX = boardWidth;
    int pipeY = 0;
    int pipeWidth = 64; //scaled by 1/6
    int pipeHeight = 512;

    class Pipe {
        int x = pipeX;
        int y = pipeY;
        int width = pipeWidth;
        int height = pipeHeight;
        Image img;
        boolean passedBird = false;
        boolean passedPaper = false;

        Pipe(Image img) {
            this.img = img;
        }
    }

    //game logic
    Bird bird;
    Bird paper;
    int velocityX = -4; //move pipes to the left spedd (simulates bird moving right)
    int gravity = 1;

    ArrayList<Pipe> pipes;
    Random random = new Random();

    Timer gameLoop;
    Timer placePipesTimer;
    boolean gameOver = false;
    boolean gameOverBird = false;
    boolean gameOverPaper = false;
    boolean paused = true;
    double scoreBird = 0;
    double scorePaper = 0;



    FlappyBird() {
        setPreferredSize(new Dimension(boardWidth, boardHeight));
        setFocusable(true);
        addKeyListener(this);

        //load images
        backgroundImg = new ImageIcon(getClass().getResource("./flappybirdbg.png")).getImage();
        birdImg = new ImageIcon(getClass().getResource("./flappybird.png")).getImage();
        topPipeImg = new ImageIcon(getClass().getResource("./toppipe.png")).getImage();
        bottomPipeImg = new ImageIcon(getClass().getResource("./bottompipe.png")).getImage();
        paperImg = new ImageIcon(getClass().getResource("./flappypaper.png")).getImage();

        //bird
        bird = new Bird(birdImg);
        paper = new Bird(paperImg);

        //pipes
        pipes = new ArrayList<Pipe>();

        //adicionar o botao de comecar aqui!
        

        //place pipes timer
        placePipesTimer = new Timer(1500, new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                placePipes();
            }
        });

        placePipesTimer.start();

        //game timer
        gameLoop = new Timer(1000/60, this); // 1000/60 = 16.6
        gameLoop.start();

    }

    public void placePipes() {
        //(0-1) * pipeHeight/2 -> (0-256)
        //128
        //0 - 128 - (0-256) --> pipeHeight/4 -> 3/4 pipeHeight

        int randomPipeY = (int) (pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2));
        int openingSpace = boardHeight/4;

        Pipe topPipe = new Pipe(topPipeImg);
        topPipe.y = randomPipeY;
        pipes.add(topPipe);

        Pipe bottomPipe = new Pipe(bottomPipeImg);
        bottomPipe.y = topPipe.y + pipeHeight + openingSpace;
        pipes.add(bottomPipe);
    }

    public void paintComponent(Graphics g) {
        super.paintComponent(g);
        draw(g);
    }

    public void draw(Graphics g) {
        //background
        g.drawImage(backgroundImg, 0, 0, boardWidth, boardHeight, null);

        //bird
        g.drawImage(bird.img, bird.x, bird.y, birdWidth, birdHeight, null);
        g.drawImage(paper.img, paper.x, paper.y, birdWidth, birdHeight, null);

        //pipes
        for (int i = 0; i < pipes.size(); i++) {
            Pipe pipe = pipes.get(i);
            g.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height, null);
        }

        //score
        g.setColor(Color.white);
        g.setFont(new Font("Arial", Font.PLAIN, 22));

        //restart message
        if (gameOver) {
            g.drawString("Bird", 10, 35);
            g.drawString("Paper", 290, 35);
            g.drawString(String.valueOf((int) scoreBird), 10, 65);
            g.drawString(String.valueOf((int) scorePaper), 290, 65);
            g.drawString("Press 'R' to Restart", 10, 620);
        } else {
            g.drawString("Bird", 10, 35);
            g.drawString("Paper", 290, 35);
            g.drawString(String.valueOf((int) scoreBird), 10, 65);
            g.drawString(String.valueOf((int) scorePaper), 290, 65);
            g.drawString("Press 'C'/'BackSpace' to Pause", 10, 620);
        }
    }

    public void move() {
        //bird
        bird.velocityY += gravity;
        bird.y += bird.velocityY;
        bird.y = Math.max(bird.y, 0);

        paper.velocityY += gravity;
        paper.y += paper.velocityY;
        paper.y = Math.max(paper.y, 0);

        //pipes
        for (int i = 0; i < pipes.size(); i++) {
            Pipe pipe = pipes.get(i);
            pipe.x += velocityX;

            if (!pipe.passedBird && bird.x > pipe.x + pipe.width) {
                if (gameOverBird == false) {
                    pipe.passedBird = true;
                    scoreBird += 0.5; //0.5 because there are 2 pipes so 0.5*2 = 1, 1 for each set of pipes
                }
            }

            if (!pipe.passedPaper && paper.x > pipe.x + pipe.width) {
                if (gameOverPaper == false) {
                    pipe.passedPaper = true;
                    scorePaper += 0.5; //0.5 because there are 2 pipes so 0.5*2 = 1, 1 for each set of pipes
                }
            }

            if (collision(bird, pipe)) {
                gameOverBird = true;
            }

            if (collision(paper, pipe)) {
                gameOverPaper = true;
            }
        }

        if (bird.y > boardHeight) {
            gameOverBird = true;
        }

        if (paper.y > boardHeight) {
            gameOverPaper = true;
        }

        if (gameOverBird && gameOverPaper) {
            gameOver = true;
        }
    }

    public boolean collision(Bird a, Pipe b) {
        return  a.x < b.x + b.width && //a's top left corner doesn't reach b's top right corner
                a.x + a.width > b.x && //a's top right corner passes b's top left corner
                a.y < b.y + b.height && //a's top left corner doesn't reach b's bottom left corner
                a.y + a.height > b.y; //a's bottom left corner passes b's top left corner
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        move();
        repaint();
        if (gameOver) {
            placePipesTimer.stop();
            gameLoop.stop();
        }
    }

    @Override
    public void keyPressed(KeyEvent e) {
        if (e.getKeyCode() == KeyEvent.VK_SPACE) {
            if (gameOverBird == false) {
                bird.velocityY = -9;
            }
        }

        if (e.getKeyCode() == KeyEvent.VK_ENTER) {
            if (gameOverPaper == false) {
                paper.velocityY = -9;
            }
        }

        if (e.getKeyCode() == KeyEvent.VK_C || e.getKeyCode() == KeyEvent.VK_BACK_SPACE) {
            paused = !paused;
            if (paused == false && gameOver == false) {
                gameLoop.stop();
                placePipesTimer.stop();
            }
            if (paused == true && gameOver == false) {
                gameLoop.start();
                placePipesTimer.start();
            }
        }

        if (e.getKeyCode() == KeyEvent.VK_R) {
            if (gameOver) {
                bird.y = birdY;
                paper.y = birdY;
                bird.velocityY = 0;
                paper.velocityY = 0;
                pipes.clear();
                scoreBird = 0;
                scorePaper = 0;
                gameLoop.start();
                placePipesTimer.start();
                gameOverBird = false;
                gameOverPaper = false;
                gameOver = false;
            }
        } 
    }

    @Override
    public void keyTyped(KeyEvent e) {
    }

    @Override
    public void keyReleased(KeyEvent e) {
    }
}
